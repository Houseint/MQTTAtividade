import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MQTTService from './src/services/mqttService';
import StatusModal from './src/components/StatusModal';
import LightControl from './src/components/LightControl';
import Gauges from './src/components/Gauges';

const mqtt = new MQTTService();
const STORAGE_KEY = '@mqttx_last_state';

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isLightOn, setIsLightOn] = useState(false);
  const [temp, setTemp] = useState(0);
  const [hum, setHum] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const mqttConfig = {
    host: 'bf3e69df925042a1805aa09d59658af2.s1.eu.hivemq.cloud',
    port: 8884,
    user: 'aluno_etec',
    pass: '1234ABCd',
    clientId: 'RN_App_' + Math.random(),
  };

  useEffect(() => {
    loadPersistedState();
  }, []);

  useEffect(() => {
    if (!isLoading) startConnection();
  }, [isLoading]);

  useEffect(() => {
    savePersistedState();
  }, [temp, hum, isLightOn]);

  const loadPersistedState = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (typeof parsed.temp === 'number') setTemp(parsed.temp);
        if (typeof parsed.hum === 'number') setHum(parsed.hum);
        if (typeof parsed.isLightOn === 'boolean') setIsLightOn(parsed.isLightOn);
      }
    } catch (error) {
      console.log('[App] Erro ao carregar estado:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePersistedState = async () => {
    try {
      const data = { temp, hum, isLightOn, lastUpdated: new Date().toISOString() };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.log('[App] Erro ao salvar estado:', error);
    }
  };

  const startConnection = () => {
    setShowError(false);
    console.log('[App] Tentando conectar ao MQTT...');
    mqtt.connect(
      mqttConfig,
      (topic, message) => {
        if (topic === 'casa/temp') setTemp(parseFloat(message));
        if (topic === 'casa/umid') setHum(parseFloat(message));
        if (topic === 'casa/luz') setIsLightOn(message === "1");
      },
      () => {
        console.log('[App] Conectado com sucesso!');
        setIsConnected(true);
        mqtt.subscribe('casa/temp');
        mqtt.subscribe('casa/umid');
        mqtt.subscribe('casa/luz');
      },
      (err) => {
        console.log('[App] Erro na conexão:', err);
        setIsConnected(false);
        setShowError(true);
      }
    );
  };

  const toggleLight = () => {
    const newState = isLightOn ? "0" : "1";
    mqtt.publish('casa/luz', newState);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Smart Home IoT</Text>

      <LightControl isLightOn={isLightOn} onToggle={toggleLight} />

      <Gauges temp={temp} hum={hum} />

      {/* Componente de Status de Conexão */}
      <StatusModal
        visible={showError}
        onRetry={startConnection}
        onLater={() => setShowError(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212',
    padding: 20, alignItems: 'center'
  },
  header: { color: '#FFF', fontSize: 24,
    fontWeight: 'bold', marginTop: 40,
    marginBottom: 20
  },
  loadingText: { color: '#FFF', fontSize: 18, marginTop: 40 },
});