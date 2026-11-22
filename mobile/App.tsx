import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import { colors } from './src/config/theme';
import { BottomTabs } from './src/navigation/BottomTabs';
import { LoginScreen } from './src/modules/AUTH/LoginScreen';
import { HomeScreen } from './src/modules/AD/HomeScreen';
import { MisPaquetesScreen } from './src/modules/LO/MisPaquetesScreen';
import { DetallePaqueteScreen } from './src/modules/FC/DetallePaqueteScreen';
import { ObservadoScreen } from './src/modules/FC/ObservadoScreen';
import { PagosScreen } from './src/modules/PG/PagosScreen';
import { AvisosScreen } from './src/modules/LO/AvisosScreen';
import { CodigoRecojoScreen } from './src/modules/QR/CodigoRecojoScreen';
import { HistorialScreen } from './src/modules/FG/HistorialScreen';
import { PerfilScreen } from './src/modules/PR/PerfilScreen';
import type { Screen } from './src/domain/models';

const pages: Record<Exclude<Screen, 'login'>, React.ComponentType> = {
  inicio: HomeScreen,
  paquetes: MisPaquetesScreen,
  detalle: DetallePaqueteScreen,
  observado: ObservadoScreen,
  pagos: PagosScreen,
  avisos: AvisosScreen,
  codigo: CodigoRecojoScreen,
  historial: HistorialScreen,
  perfil: PerfilScreen,
};
function Navigator() {
  const { isLoggedIn, screen } = useApp();
  if (!isLoggedIn || screen === 'login') return <LoginScreen />;
  const Page = pages[screen];
  return <View style={styles.shell}><Page /><BottomTabs /></View>;
}
export default function App() {
  return <SafeAreaProvider><View style={styles.desktop}>
    <SafeAreaView style={styles.phone} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <AppProvider><Navigator /></AppProvider>
    </SafeAreaView>
  </View></SafeAreaProvider>;
}
const styles = StyleSheet.create({
  desktop:{flex:1,backgroundColor:Platform.OS==='web'?'#E8E6E2':colors.background,alignItems:'center',justifyContent:'center'},
  phone:{flex:1,width:'100%',maxWidth:470,backgroundColor:colors.background,overflow:'hidden',shadowColor:'#000',shadowOpacity:Platform.OS==='web'?0.08:0,shadowRadius:25},
  shell:{flex:1,position:'relative'},
});
