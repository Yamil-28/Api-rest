import React, { useRef, useState } from 'react';
import { View, Alert, StyleSheet, TextInput } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { cofreRequest } from '../../api/HttpRepository';
import { Button, Card, Header, ScreenBody, Txt } from '../../components/Primitives';
import { useApp } from '../../context/AppContext';

/** Solo para el personal autenticado y autorizado; el backend comprueba el rol en cada solicitud. */
export function ValidarRecojoScreen() {
  const {staff,back}=useApp();
  const [permission,requestPermission]=useCameraPermissions();
  const [texto,setTexto]=useState('');
  const [resultado,setResultado]=useState('');
  const [scanning,setScanning]=useState(true);
  const processing=useRef(false);
  const validar=async(raw:string)=>{
    if(processing.current)return;
    const match=/^COFRE:V1:([A-Za-z0-9_-]{35,70})$/.exec(raw.trim());
    if(!match){setResultado('QR incorrecto: no es un código de retiro Cofre Express');return;}
    processing.current=true;setScanning(false);
    try{
      const resp=await cofreRequest('/cofre/recojo/validar','POST',{token:match[1]}) as {ok?:boolean;paqueteId?:number};
      setResultado(resp.ok?`Entrega confirmada para paquete #${resp.paqueteId}`:'Código no reconocido');
    }catch(e){setResultado(e instanceof Error?e.message:'No se pudo validar el código');}
    finally{processing.current=false;}
  };
  return <><Header title="Validar retiro" subtitle="Uso exclusivo del personal autorizado" back={back}/><ScreenBody>
   {!staff?<Card><Txt>Tu cuenta no tiene permiso de entrega.</Txt></Card>:<>
    <Card><Txt bold>Escanear QR de recojo</Txt><Txt muted size={11}>El código debe estar vigente y el pago del locker confirmado.</Txt>
     {!permission?<Txt>Cargando permiso de cámara...</Txt>:!permission.granted?<Button label="Permitir cámara" onPress={()=>{void requestPermission();}}/>:scanning?<View style={styles.camera}><CameraView style={{flex:1}} facing="back" barcodeScannerSettings={{barcodeTypes:['qr']}} onBarcodeScanned={({ data }: { data: string }) => {
  void validar(data);
}}/></View>:<Button label="Escanear otro QR" variant="outline" onPress={()=>{setResultado('');setScanning(true);}}/>}
    </Card>
    <Card><Txt bold>Alternativa de prueba manual</Txt><TextInput style={styles.input} value={texto} onChangeText={setTexto} placeholder="COFRE:V1:..." autoCapitalize="none"/><Button label="Validar código" onPress={()=>{void validar(texto);}}/></Card>
    {resultado?<Card><Txt>{resultado}</Txt></Card>:null}
   </>}
  </ScreenBody></>;
}
const styles=StyleSheet.create({camera:{height:290,marginTop:15,borderRadius:12,overflow:'hidden'},input:{borderWidth:1,borderColor:'#ddd',borderRadius:10,padding:12,marginVertical:12}});
