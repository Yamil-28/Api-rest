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
 const {screen,navigate,revisor,staff,hasBuyerRole,hasMerchantRole}=useApp();
 if(!hasBuyerRole && !hasMerchantRole && (revisor||staff)) {
  const teamTabs: {screen:Screen; title:string;icon:React.ComponentProps<typeof Feather>['name']}[] = [];
  if(revisor) teamTabs.push({screen:'revisar-pagos',title:'Revisar pagos',icon:'file-text'});
  if(staff) teamTabs.push({screen:'validar',title:'Validar retiro',icon:'check-circle'});
  teamTabs.push({screen:'perfil',title:'Perfil',icon:'user'});
  return <View style={styles.wrap}>{teamTabs.map(tab=><Pressable key={tab.screen} onPress={()=>navigate(tab.screen)} style={[styles.tab,screen===tab.screen&&styles.active]}>
    <Feather name={tab.icon} size={18} color={screen===tab.screen?colors.deepAmber:colors.muted}/><Txt size={10}>{tab.title}</Txt>
  </Pressable>)}</View>;
 }
 const active = ['detalle','observado','codigo','historial'].includes(screen) ? 'paquetes' : screen;
 return <View style={styles.wrap}>{tabs.map(tab=><Pressable accessibilityLabel={`Ir a ${tab.title}`} key={tab.screen} onPress={()=>navigate(tab.screen)} style={[styles.tab,active===tab.screen&&styles.active]}>
  <Feather name={tab.icon} size={18} color={active===tab.screen?colors.deepAmber:colors.muted}/>
  <Txt size={10} bold={active===tab.screen} style={{color:active===tab.screen?colors.deepAmber:colors.muted}}>{tab.title}</Txt>
 </Pressable>)}</View>;
}
const styles=StyleSheet.create({wrap:{height:66,paddingVertical:7,paddingHorizontal:8,backgroundColor:'#FFF',borderTopWidth:1,borderColor:colors.line,flexDirection:'row',justifyContent:'space-around',alignItems:'center'},tab:{minWidth:55,alignItems:'center',justifyContent:'center',gap:4,borderRadius:10,paddingVertical:6},active:{backgroundColor:'#F8F6F2'}});
