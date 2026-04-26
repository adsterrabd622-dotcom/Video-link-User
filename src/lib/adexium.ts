export const showAdexiumAd = (): Promise<void> => {
  return new Promise((resolve) => {
    let resolved = false;
    const finish = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };

    const timeoutId = setTimeout(() => {
      console.warn("Adexium: Ad load timeout exceeded.");
      finish();
    }, 8000);

    try {
      if (typeof (window as any).Widget !== 'undefined') {
        const adexiumWidget = new (window as any).AdexiumWidget({
          wid: 'bcd07615-2abd-47d6-9387-13862e0533bc', 
          adFormat: 'interstitial'
        });
        
        // As per documentation given by the user, we initialize autoMode.
        // Since we don't have a callback to know when autoMode completes, 
        // we'll run it, and resolve after a slight delay to allow the widget to execute.
        adexiumWidget.autoMode();
        
        // Wait 3 seconds arbitrarily for adexium to process if it's an interstitial popup
        setTimeout(() => {
          clearTimeout(timeoutId);
          finish();
        }, 3000);
      } else {
        clearTimeout(timeoutId);
        console.warn("Adexium SDK not loaded");
        finish(); // resolve anyway
      }
    } catch (e) {
      clearTimeout(timeoutId);
      console.error("Adexium error:", e);
      finish();
    }
  });
};
