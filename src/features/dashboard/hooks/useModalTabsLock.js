import { useEffect, useRef } from "react";

/**
 * Hook para bloquear las pestañas inferiores del navegador cuando algún modal
 * o diálogo de interacción crítica se encuentra abierto en pantalla.
 */
export function useModalTabsLock({
  isModalOpen,
  closeAllModals,
  setTabsLocked,
  setTabsLockCloseHandler,
}) {
  const closeAllModalsRef = useRef(closeAllModals);
  closeAllModalsRef.current = closeAllModals;

  useEffect(() => {
    setTabsLocked(isModalOpen);

    if (isModalOpen) {
      setTabsLockCloseHandler(() => closeAllModalsRef.current?.());
    } else {
      setTabsLockCloseHandler(null);
    }

    return () => {
      setTabsLocked(false);
      setTabsLockCloseHandler(null);
    };
  }, [isModalOpen, setTabsLocked, setTabsLockCloseHandler]);
}
