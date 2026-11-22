import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Txt, Button } from '../../components/Primitives';
import { colors } from '../../config/theme';
import { settings } from '../../config/env';
import { useApp } from '../../context/AppContext';
export function LoginScreen(){
 const {signInDemo}=useApp();
 const [register,setRegister]=useState(false),[phone,setPhone]=useState(''),[password,setPassword]=useState(''),[show,setShow]=useState(false);
 const enter=()=>{
  if(settings.dataSource==='api') { Alert.alert('Autenticación pendiente','Se requiere integrar Supabase Auth y autorización JWT del backend. No se habilita un inicio de sesión falso con datos reales.');return; }
  signInDemo();
 };
 return <KeyboardAvoidingView style={styles.base} behavior={Platform.OS==='ios'?'padding':undefined}>
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
  <View style={styles.arc}><View style={styles.arcInner}/></View>
  <View style={{paddingTop:Platform.OS==='web'?118:165}}>
   <Txt size={30} bold style={{letterSpacing:-1}}>{register?'Regístrate':'Login'}</Txt>
   <Txt muted size={13} style={{marginTop:8}}>Cofre Express · Compras y entregas</Txt>
  </View>
  <View style={styles.row}><Txt size={12}>¿No tengo una cuenta?</Txt><Pressable onPress={()=>setRegister(v=>!v)}><Txt size={12} bold style={{color:colors.red}}>{register?'Iniciar sesión':'Regístrate aquí'}</Txt></Pressable></View>
  <View style={styles.inputWrap}><Txt size={14}>🇧🇴 +591</Txt><TextInput placeholder="Número de teléfono" keyboardType="phone-pad" value={phone} onChangeText={setPhone} placeholderTextColor="#969696" style={styles.field}/></View>
  <View style={styles.inputWrap}><Feather name="lock" size={15} color={colors.muted}/><TextInput placeholder="Contraseña" secureTextEntry={!show} value={password} onChangeText={setPassword} placeholderTextColor="#969696" style={styles.field}/><Pressable onPress={()=>setShow(v=>!v)}><Feather name={show?'eye-off':'eye'} size={16} color={colors.muted}/></Pressable></View>
  {register&&<View style={styles.inputWrap}><Feather name="user" size={15} color={colors.muted}/><TextInput placeholder="Nombre completo" placeholderTextColor="#969696" style={styles.field}/></View>}
  <View style={{marginTop:20}}><Button variant="amber" label={register?'Crear perfil de demostración':'Entrar en modo demostración'} onPress={enter}/></View>
  <Txt muted size={11} style={{textAlign:'center',lineHeight:17,marginTop:12}}>{settings.dataSource==='mock'?'Modo demostración: muestra datos ficticios; no autentica usuarios ni registra cuentas.':'Modo API: el inicio de sesión real requiere el módulo Supabase Auth del equipo.'}</Txt>
  </ScrollView>
 </KeyboardAvoidingView>;
}
const styles=StyleSheet.create({base:{flex:1,backgroundColor:'white'},scroll:{flexGrow:1,paddingHorizontal:34,paddingBottom:30,gap:14},arc:{position:'absolute',top:-100,left:-120,width:360,height:360,borderRadius:180,backgroundColor:colors.amber},arcInner:{position:'absolute',top:100,left:100,width:115,height:140,borderRadius:90,backgroundColor:'white',opacity:.06},row:{flexDirection:'row',gap:8,alignItems:'center',marginTop:10},inputWrap:{minHeight:48,borderRadius:30,backgroundColor:'#F6F5F4',paddingHorizontal:15,flexDirection:'row',alignItems:'center',gap:8},field:{flex:1,fontSize:13,color:colors.ink}});
