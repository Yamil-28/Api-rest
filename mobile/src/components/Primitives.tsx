import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../config/theme';
import { settings } from '../config/env';

export function Txt({children,style,muted=false,bold=false,size=14,numberOfLines}: {children:React.ReactNode;style?:any;muted?:boolean;bold?:boolean;size?:number;numberOfLines?:number}) {
  return <Text numberOfLines={numberOfLines} style={[{fontSize:size,color:muted?colors.muted:colors.ink,fontWeight:bold?'700':'400'},style]}>{children}</Text>;
}
export function Card({children,style,onPress}: {children:React.ReactNode;style?:StyleProp<ViewStyle>;onPress?:()=>void}) {
  const content=<View style={[styles.card,style]}>{children}</View>;
  return onPress?<Pressable accessibilityRole="button" onPress={onPress}>{content}</Pressable>:content;
}
export function ScreenBody({children}: {children:React.ReactNode}) {
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>{children}</ScrollView>;
}
export function Header({title,subtitle,back,onRight}: {title:string;subtitle?:string;back?:()=>void;onRight?:()=>void}) {
 return <View style={styles.header}>
   {back && <Pressable accessibilityLabel="Volver" onPress={back} style={styles.iconButton}><Feather name="chevron-left" size={18} color={colors.ink}/></Pressable>}
   <View style={{flex:1}}><Txt bold size={17}>{title}</Txt>{subtitle?<Txt muted size={10} style={{marginTop:2}}>{subtitle}</Txt>:null}</View>
   {onRight && <Pressable onPress={onRight} style={styles.iconButton}><Feather name="bell" size={17} color={colors.ink}/></Pressable>}
 </View>;
}
export function Button({label,onPress,variant='primary',icon,disabled=false,style}: {label:string;onPress:()=>void;variant?:'primary'|'secondary'|'outline'|'amber';icon?:React.ComponentProps<typeof Feather>['name'];disabled?:boolean;style?:StyleProp<ViewStyle>}) {
  const dark=variant==='primary',amber=variant==='amber';
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button,{backgroundColor:dark?colors.charcoal:amber?colors.amber:colors.white,borderWidth:variant==='outline'?1:0,borderColor:colors.line,opacity:disabled?.5:1},style]}>
    {icon?<Feather name={icon} size={16} color={dark?'white':colors.ink}/>:null}
    <Txt bold size={13} style={{color:dark?'white':colors.ink,textAlign:'center'}}>{label}</Txt>
  </Pressable>;
}
export function Chip({label,active,onPress}: {label:string;active:boolean;onPress:()=>void}) {
 return <Pressable onPress={onPress} style={[styles.chip,active?styles.activeChip:null]}><Txt size={11} bold={active} style={{color:active?'white':colors.ink}}>{label}</Txt></Pressable>;
}
export function Status({text,tone='amber'}:{text:string;tone?:'green'|'red'|'blue'|'amber'}) {
 const toneMap={green:[colors.greenLight,colors.green],red:[colors.redLight,colors.red],blue:[colors.blueLight,colors.blue],amber:[colors.amberLight,colors.deepAmber]} as const;
 return <View style={{paddingHorizontal:8,paddingVertical:5,borderRadius:999,backgroundColor:toneMap[tone][0]}}><Txt bold size={10} style={{color:toneMap[tone][1]}}>{text}</Txt></View>;
}
export function IconTile({name,color=colors.deepAmber}: {name:React.ComponentProps<typeof Feather>['name'];color?:string}) {
 return <View style={{width:35,height:35,borderRadius:11,backgroundColor:colors.amberLight,alignItems:'center',justifyContent:'center'}}><Feather size={17} name={name} color={color}/></View>;
}
export function PillInfo({label,value}: {label:string;value:string}) {
 return <Card style={{flex:1,padding:13,minHeight:67}}><Txt size={10} muted>{label}</Txt><Txt size={17} bold style={{marginTop:6}}>{value}</Txt></Card>;
}
export function Empty({title,description}: {title:string;description?:string}) {
 return <Card style={{alignItems:'center',padding:30,gap:7}}><Feather name="inbox" size={27} color={colors.muted}/><Txt bold>{title}</Txt>{description?<Txt muted size={12} style={{textAlign:'center'}}>{description}</Txt>:null}</Card>;
}
export function ResourceGate({loading,error,onRetry,children}: {loading:boolean;error?:string;onRetry:()=>void;children:React.ReactNode}) {
 if(loading) return <View style={{padding:42,alignItems:'center'}}><ActivityIndicator color={colors.deepAmber}/><Txt muted size={12} style={{marginTop:12}}>Cargando datos…</Txt></View>;
 if(error) return <Card style={{gap:10,padding:18}}><Status text="No disponible" tone="red"/><Txt bold>Error al consultar la API</Txt><Txt size={12} muted>{error}</Txt><Button variant="outline" label="Reintentar" onPress={onRetry}/></Card>;
 return <>{children}</>;
}
export function DemoFlag() {
 return settings.dataSource==='mock'?<View style={styles.mockFlag}><Feather name="info" size={12} color={colors.deepAmber}/><Txt size={10} style={{color:colors.deepAmber}}>Datos de demostración • sin conexión a backend</Txt></View>:null;
}
export function Hero({children}: {children:React.ReactNode}) {
 return <LinearGradient colors={['#FFC75F','#FFA70A','#F5B23E']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.hero}>{children}</LinearGradient>;
}
export function InfoRow({label,value}: {label:string;value:string}) {
 return <View style={styles.infoRow}><Txt size={12} muted style={{flex:1}}>{label}</Txt><Txt size={12} bold style={{flex:1,textAlign:'right'}}>{value}</Txt></View>;
}
const styles=StyleSheet.create({
 card:{backgroundColor:colors.white,borderRadius:16,borderWidth:1,borderColor:colors.line,padding:14,shadowColor:'#000',shadowOffset:{width:0,height:3},shadowOpacity:.035,shadowRadius:8,elevation:1},
 scroll:{padding:15,paddingBottom:110,gap:12},
 header:{backgroundColor:colors.white,paddingHorizontal:16,paddingVertical:14,minHeight:70,flexDirection:'row',alignItems:'center',gap:10,borderBottomWidth:1,borderColor:colors.line},
 iconButton:{height:34,width:34,borderRadius:18,borderWidth:1,borderColor:colors.line,alignItems:'center',justifyContent:'center'},
 button:{flexDirection:'row',alignItems:'center',justifyContent:'center',paddingHorizontal:15,paddingVertical:13,borderRadius:12,gap:8,minHeight:44},
 chip:{backgroundColor:colors.white,borderWidth:1,borderColor:colors.line,paddingHorizontal:12,paddingVertical:9,borderRadius:999},
 activeChip:{backgroundColor:colors.charcoal,borderColor:colors.charcoal},
 hero:{padding:18,borderRadius:23,overflow:'hidden',minHeight:205},
 infoRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderBottomWidth:1,borderColor:colors.line,paddingVertical:11,gap:10},
 mockFlag:{borderRadius:12,padding:9,gap:6,alignItems:'center',justifyContent:'center',flexDirection:'row',backgroundColor:colors.amberLight},
});
