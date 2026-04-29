import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { RoomQRCode } from "react-gameroom";

interface AddWordsModalProps {
  open: boolean;
  roomId: string;
  onClose: () => void;
}

function buildAddWordsUrl(roomId: string): string {
  if (typeof window === "undefined") return `/room/${roomId}/add-words`;
  return `${window.location.origin}/room/${roomId}/add-words`;
}

export default function AddWordsModal({ open, roomId, onClose }: AddWordsModalProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const url = buildAddWordsUrl(roomId);

  return (
    <dialog
      ref={dialogRef}
      className="add-words-modal"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="add-words-modal__content">
        <h2 className="add-words-modal__title">{t("addWords.title")}</h2>
        <p className="add-words-modal__hint">{t("addWords.instructions")}</p>
        <div className="add-words-modal__qr">
          <RoomQRCode roomId={roomId} url={url} size={220} />
        </div>
        <p className="add-words-modal__url">{url}</p>
        <button type="button" className="btn btn--outline" onClick={onClose}>
          {t("addWords.close")}
        </button>
      </div>
    </dialog>
  );
}
