export const initializeAdsgram = (blockId: string) => {
  console.log(`Initializing Adsgram with Block ID: ${blockId}`);
};

export const showAdsgramAd = async (blockId: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const AdController = (window as any).Adsgram?.init({ blockId });
    if (AdController) {
      AdController.show()
        .then(() => resolve(true))
        .catch((err: any) => {
          console.error('Ad failed', err);
          resolve(false);
        });
    } else {
      console.log(`Simulating Ad (SDK missing) for Block ID: ${blockId}`);
      setTimeout(() => resolve(true), 1500);
    }
  });
};
