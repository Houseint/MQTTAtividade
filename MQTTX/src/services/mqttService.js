import mqtt from 'mqtt';

export default class MQTTService {
  constructor() {
    this.client = null;
    this.messageHandlers = {};
  }

  connect(config, onMessage, onConnect, onFailure) {
    const { host, port, user, pass, clientId } = config;

    try {
      // Construir URL com protocolo WebSocket seguro
      const protocol = 'wss'; // WebSocket Secure para porta 8884
      const brokerUrl = `${protocol}://${host}:${port}/mqtt`;
      
      console.log('[MQTT] Conectando a:', brokerUrl);

      this.client = mqtt.connect(brokerUrl, {
        clientId: clientId,
        username: user,
        password: pass,
        reconnectPeriod: 1000,
        connectTimeout: 30000,
        clean: true,
      });

      this.client.on('connect', () => {
        console.log('[MQTT] Conectado com sucesso!');
        if (onConnect) onConnect();
      });

      this.client.on('message', (topic, payload) => {
        const message = payload.toString();
        console.log('[MQTT] Mensagem recebida:', topic, message);
        if (onMessage) onMessage(topic, message);
      });

      this.client.on('error', (error) => {
        console.log('[MQTT] Erro:', error.message || error);
        if (onFailure) onFailure(error);
      });

      this.client.on('offline', () => {
        console.log('[MQTT] Offline');
      });

      this.client.on('reconnect', () => {
        console.log('[MQTT] Reconectando...');
      });

    } catch (error) {
      console.log('[MQTT] Erro ao conectar:', error);
      if (onFailure) onFailure(error);
    }
  }

  subscribe(topic) {
    if (this.client && this.client.connected) {
      console.log('[MQTT] Subscrevendo em:', topic);
      this.client.subscribe(topic, (err) => {
        if (err) {
          console.log('[MQTT] Erro ao subscrever:', topic, err);
        } else {
          console.log('[MQTT] Subscrito em:', topic);
        }
      });
    } else {
      console.log('[MQTT] Cliente não conectado');
    }
  }

  publish(topic, message) {
    if (this.client && this.client.connected) {
      console.log('[MQTT] Publicando:', topic, message);
      this.client.publish(topic, message, (err) => {
        if (err) {
          console.log('[MQTT] Erro ao publicar:', err);
        }
      });
    } else {
      console.log('[MQTT] Cliente não conectado, não foi possível publicar');
    }
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      console.log('[MQTT] Desconectado');
    }
  }
}