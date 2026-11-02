const { contextBridge, ipcRenderer } = require("electron");
// 임의 채널 전송, 파일 접근, Node API는 렌더러에 노출하지 않는다.
contextBridge.exposeInMainWorld("doranDesktop", {
  isPopup: new URLSearchParams(location.search).has("popup"),
  openPopup: () => ipcRenderer.invoke("doran:open-popup"),
  toggleTop: () => ipcRenderer.invoke("doran:toggle-top"),
  closePopup: () => ipcRenderer.send("doran:close-popup"),
});
