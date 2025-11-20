import { useEffect } from 'react';

const getDocumentBody = () =>
  typeof document !== 'undefined' && document.body ? document.body : null;

const useLockBodyScroll = (active = true) => {
  useEffect(() => {
    if (!active) {
      return undefined;
    }

    const body = getDocumentBody();
    if (!body) {
      return undefined;
    }

    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    return () => {
      if (!body) {
        return;
      }
      body.style.overflow = previousOverflow || '';
    };
  }, [active]);
};

export default useLockBodyScroll;


