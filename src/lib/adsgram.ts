// src/lib/adsgram.ts

export const showAdsgramAd = async (blockId: string): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const Adsgram = (window as any).Adsgram;
      if (Adsgram) {
        const AdController = Adsgram.init({ blockId: blockId });
        AdController.show()
          .then(() => {
            console.log("User watched the ad completely.");
            resolve(true);
          })
          .catch((err: any) => {
            console.error('User skipped or ad error', err);
            // It could be Adblock, or user skipped.
            // Returning false so they don't get the reward unless they watch it.
            resolve(false);
          });
      } else {
        console.warn("Adsgram SDK script not loaded correctly.");
        // Fallback for development/testing if SDK is blocked by AdBlocker
        setTimeout(() => resolve(true), 1500);
      }
    } catch (e) {
      console.error('Adsgram exception', e);
      resolve(false);
    }
  });
};
