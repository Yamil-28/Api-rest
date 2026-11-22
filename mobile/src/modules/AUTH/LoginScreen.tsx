import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Txt, Button } from '../../components/Primitives';
import { colors } from '../../config/theme';
import { settings } from '../../config/env';
import { useApp } from '../../context/AppContext';
export function LoginScreen(){
 const {signInDemo,signInReal}=useApp();
 const [register,setRegister]=useState(false),[phone,setPhone]=useState(''),[password,setPassword]=useState(''),[show,setShow]=useState(false),[busy,setBusy]=useState(false);
 const enter=async()=>{
  if(settings.dataSource==='api'){
   if(register){Alert.alert('Alta supervisada','Solicita al administrador crear y vincular tu cuenta al perfil de Cofre Express.');return;}
   if(busy)return;setBusy(true);try{await signInReal(phone,password);}catch(e){Alert.alert('No se pudo entrar',e instanceof Error?e.message:'Error de autenticación');}finally{setBusy(false);}return;
  }
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
  <View style={styles.inputWrap}><Txt size={14}>{settings.dataSource==='api'?'✉':'🇧🇴 +591'}</Txt><TextInput placeholder={settings.dataSource==='api'?'Correo electrónico':'Número de teléfono'} keyboardType={settings.dataSource==='api'?'email-address':'phone-pad'} autoCapitalize="none" value={phone} onChangeText={setPhone} placeholderTextColor="#969696" style={styles.field}/></View>
  <View style={styles.inputWrap}><Feather name="lock" size={15} color={colors.muted}/><TextInput placeholder="Contraseña" secureTextEntry={!show} value={password} onChangeText={setPassword} placeholderTextColor="#969696" style={styles.field}/><Pressable onPress={()=>setShow(v=>!v)}><Feather name={show?'eye-off':'eye'} size={16} color={colors.muted}/></Pressable></View>
  {register&&<View style={styles.inputWrap}><Feather name="user" size={15} color={colors.muted}/><TextInput placeholder="Nombre completo" placeholderTextColor="#969696" style={styles.field}/></View>}
  <View style={{marginTop:20}}><Button variant="amber" label={busy?'Verificando...':settings.dataSource==='api'?(register?'Solicitar registro':'Iniciar sesión'):(register?'Crear perfil de demostración':'Entrar en modo demostración')} onPress={enter}/></View>
  <Txt muted size={11} style={{textAlign:'center',lineHeight:17,marginTop:12}}>{settings.dataSource==='mock'?'Modo demostración: muestra datos ficticios; no autentica usuarios ni registra cuentas.':'Modo API: inicio de sesión real con Supabase Auth. La cuenta debe estar vinculada por el administrador.'}</Txt>
  </ScrollView>
 </KeyboardAvoidingView>;
}
const styles=StyleSheet.create({base:{flex:1,backgroundColor:'white'},scroll:{flexGrow:1,paddingHorizontal:34,paddingBottom:30,gap:14},arc:{position:'absolute',top:-100,left:-120,width:360,height:360,borderRadius:180,backgroundColor:colors.amber},arcInner:{position:'absolute',top:100,left:100,width:115,height:140,borderRadius:90,backgroundColor:'white',opacity:.06},row:{flexDirection:'row',gap:8,alignItems:'center',marginTop:10},inputWrap:{minHeight:48,borderRadius:30,backgroundColor:'#F6F5F4',paddingHorizontal:15,flexDirection:'row',alignItems:'center',gap:8},field:{flex:1,fontSize:13,color:colors.ink}});
