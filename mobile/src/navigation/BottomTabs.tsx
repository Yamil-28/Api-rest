import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Txt } from '../components/Primitives';
import { colors } from '../config/theme';
import type { Screen } from '../domain/models';
const tabs: {screen:Screen;title:string;icon:React.ComponentProps<typeof Feather>['name']}[] = [
 {screen:'inicio',title:'Inicio',icon:'home'}, {screen:'paquetes',title:'Paquetes',icon:'package'},
 {screen:'pagos',title:'Pagos',icon:'credit-card'}, {screen:'avisos',title:'Avisos',icon:'bell'},
 {screen:'perfil',title:'Perfil',icon:'user'},
];
export function BottomTabs(){
 const {screen,navigate}=useApp();
 const active = ['detalle','observado','codigo','historial'].includes(screen) ? 'paquetes' : screen;
 return <View style={styles.wrap}>{tabs.map(tab=><Pressable accessibilityLabel={`Ir a ${tab.title}`} key={tab.screen} onPress={()=>navigate(tab.screen)} style={[styles.tab,active===tab.screen&&styles.active]}>
  <Feather name={tab.icon} size={18} color={active===tab.screen?colors.deepAmber:colors.muted}/>
  <Txt size={10} bold={active===tab.screen} style={{color:active===tab.screen?colors.deepAmber:colors.muted}}>{tab.title}</Txt>
 </Pressable>)}</View>;
}
const styles=StyleSheet.create({wrap:{height:66,paddingVertical:7,paddingHorizontal:8,backgroundColor:'#FFF',borderTopWidth:1,borderColor:colors.line,flexDirection:'row',justifyContent:'space-around',alignItems:'center'},tab:{minWidth:55,alignItems:'center',justifyContent:'center',gap:4,borderRadius:10,paddingVertical:6},active:{backgroundColor:'#F8F6F2'}});
