const {
  app,
  BrowserWindow,
  ipcMain,
  protocol,
  net,
  Menu,
} = require("electron");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const ICON_PATH = path.join(__dirname, "build", "icon.png");

// GitHub Pages 주소는 이 한 곳에서 변경한다. 기본 실행은 내장 파일(오프라인)이다.
const PAGES_URL = "https://YOUR-NAME.github.io/YOUR-REPOSITORY/";
// 명시적으로 `electron . --pages`로 실행했을 때만 Pages를 연다.
const usePages = process.argv.includes("--pages");
const baseURL = usePages ? PAGES_URL : "doran://app/index.html";
let mainWindow;
let popupWindow;
protocol.registerSchemesAsPrivileged([
  {
    scheme: "doran",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);
const prefs = () => ({
  preload: path.join(__dirname, "preload.cjs"),
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  backgroundThrottling: false,
});
function allowed(url) {
  try {
    const u = new URL(url),
      b = new URL(baseURL);
    return (
      u.protocol === b.protocol &&
      u.host === b.host &&
      u.pathname === b.pathname
    );
  } catch {
    return false;
  }
}
function secureWindow(win) {
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (event, url) => {
    if (!allowed(url)) event.preventDefault();
  });
  win.webContents.on("will-attach-webview", (event) => event.preventDefault());
  win.webContents.session.setPermissionRequestHandler(
    (_wc, _permission, callback) => callback(false),
  );
}
function verify(event, win) {
  if (
    !win ||
    win.isDestroyed() ||
    event.sender !== win.webContents ||
    event.senderFrame !== win.webContents.mainFrame ||
    !allowed(event.senderFrame.url)
  )
    throw new Error("허용되지 않은 창이에요.");
}
function openPopup() {
  if (popupWindow && !popupWindow.isDestroyed()) {
    popupWindow.focus();
    return;
  }
  popupWindow = new BrowserWindow({
    width: 720,
    height: 480,
    useContentSize: true,
    minWidth: 360,
    minHeight: 240,
    hasShadow: false,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    alwaysOnTop: true,
    autoHideMenuBar: true,
    icon: ICON_PATH,
    webPreferences: prefs(),
  });
  popupWindow.setAspectRatio(1.5);
  secureWindow(popupWindow);
  const url = new URL(baseURL);
  url.searchParams.set("popup", "1");
  popupWindow.loadURL(url.toString());
  popupWindow.on("closed", () => {
    popupWindow = null;
  });
}
app.whenReady().then(() => {
  const webRoot = app.isPackaged
    ? path.join(process.resourcesPath, "web")
    : path.resolve(__dirname, "../dist");
  protocol.handle("doran", (request) => {
    try {
      const u = new URL(request.url);
      if (u.host !== "app")
        return new Response("찾을 수 없어요.", { status: 404 });
      const file = path.resolve(webRoot, "." + decodeURIComponent(u.pathname));
      if (!file.startsWith(webRoot + path.sep))
        return new Response("접근할 수 없어요.", { status: 403 });
      return net.fetch(pathToFileURL(file).toString());
    } catch {
      return new Response("파일을 열 수 없어요.", { status: 400 });
    }
  });
  app.setAppUserModelId("com.doran.desktop");
  Menu.setApplicationMenu(null);
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    useContentSize: false,
    minWidth: 1200,
    minHeight: 800,
    maxWidth: 1200,
    maxHeight: 800,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    title: "도란",
    backgroundColor: "#f7f5ef",
    icon: ICON_PATH,
    webPreferences: prefs(),
  });
  secureWindow(mainWindow);
  mainWindow.loadURL(baseURL);
  mainWindow.on("closed", () => {
    if (popupWindow && !popupWindow.isDestroyed()) popupWindow.close();
    mainWindow = null;
  });
  ipcMain.handle("doran:open-popup", (event) => {
    verify(event, mainWindow);
    openPopup();
  });
  ipcMain.handle("doran:toggle-top", (event) => {
    verify(event, popupWindow);
    const next = !popupWindow.isAlwaysOnTop();
    popupWindow.setAlwaysOnTop(next);
    return next;
  });
  ipcMain.on("doran:close-popup", (event) => {
    try {
      verify(event, popupWindow);
      popupWindow.close();
    } catch {
      /* 허용되지 않은 창에서의 닫기 요청은 무시한다. */
    }
  });
});
app.on("window-all-closed", () => app.quit());
