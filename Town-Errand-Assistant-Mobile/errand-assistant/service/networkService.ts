import NetInfo from '@react-native-community/netinfo';

export const networkService = {
  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return !!state.isConnected;
  },

  addConnectivityListener(callback: (online: boolean) => void): () => void {
    return NetInfo.addEventListener((state) => {
      callback(!!state.isConnected);
    });
  },
};
