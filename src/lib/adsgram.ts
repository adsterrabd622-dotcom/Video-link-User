export const initializeAdsgram = (blockId: string) => {
  console.log(Initializing Adsgram with Block ID: ${blockId});
};

export const showAdsgramAd = async (blockId: string): Promise<boolean> => {
  return new Promise((resolve) => {
    // Adsgram SDK init
    const AdController = (window as any).Adsgram?.init({ blockId });
    if (AdController) {
      AdController.show()
        .then(() => resolve(true))
        .catch((err: any) => {
          console.error('Ad failed', err);
          resolve(false);
        });
    } else {
      // Fallback for simulation if SDK missing
      console.log(Simulating Ad for Block ID: ${blockId});
      setTimeout(() => resolve(true), 1500);
    }
  });
};
