export const showGigaPubAd = (): Promise<void> => {
  return new Promise((resolve) => {
    let resolved = false;
    const finish = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };
             
    // Safety timeout in case the ad struggles to load
    const timeoutId = setTimeout(() => {
      console.warn("GigaPub: Ad load timeout exceeded.");
      finish();
    }, 8000);

    try {
      if (typeof (window as any).showGiga === 'function') {
        (window as any).showGiga()
          .then(() => {
            clearTimeout(timeoutId);
            finish();
          })
          .catch((e: any) => {
            clearTimeout(timeoutId);
            const errorMsg = e?.message || e?.toString() || '';
            if (!errorMsg.toLowerCase().includes('already showing')) {
              console.error("GigaPub Error:", e);
            }
            // Even if it fails, we keep the flow moving so the user isn't stuck
            finish(); 
          });
      } else {
        clearTimeout(timeoutId);
        console.warn("GigaPub SDK not loaded");
        finish(); // Fallback resolve to prevent breaking the flow
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error(error);
      finish();
    }
  });
};
