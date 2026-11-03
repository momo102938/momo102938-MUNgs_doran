import { APP_VERSION } from "../version";
import { KotraHeading } from "./KotraText";
import { useEffect, useRef } from "react";
export function StartNotice({ onStart }: { onStart: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="start-notice"
      aria-labelledby="start-notice-title"
      onCancel={onStart}
    >
      <div className="start-notice-heading">
        <img className="start-notice-icon" src="./icon.png" alt="" />
        <div className="start-notice-title-row">
          <KotraHeading level={2} id="start-notice-title">
            도란을 시작하기 전에
          </KotraHeading>
          <small className="app-version">v{APP_VERSION}</small>
        </div>
      </div>
      <p>
        도란은 기본 프로그램을 먼저 개발한 뒤, 바이브 코딩으로 기능과 세부
        설정을 더해 제작한 생활 시뮬레이션 프로그램입니다.
      </p>
      <ul>
        <li>
          개발과 수정을 이어가는 프로그램으로, 일부 동작이나 대사가
          부자연스럽거나 오류가 발생할 수 있습니다.
        </li>
        <li>
          캐릭터의 대사와 행동은 정해진 규칙을 바탕으로 만들어지며, 설정한
          성격과 관계를 완벽하게 재현하지는 못할 수 있습니다.
        </li>
        <li>
          캐릭터 이미지는 직접 제작했거나 사용 허락을 받은 이미지를 사용해
          주세요.
        </li>
        <li>
          업데이트 전에는 작업 파일이 날아가지 않게 ‘도란 파일 내보내기’로
          백업해 주세요!
        </li>
      </ul>
      <button className="primary" autoFocus onClick={onStart}>
        시작하기
      </button>
    </dialog>
  );
}
