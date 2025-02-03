<?xml version="1.0" encoding="UTF-8"?>
<simconf>
  <!-- Project Directories -->
  <project EXPORT="discard">[APPS_DIR]/mrm</project>
  <project EXPORT="discard">[APPS_DIR]/mspsim</project>
  <project EXPORT="discard">[APPS_DIR]/mobility</project>
  <project EXPORT="discard">[APPS_DIR]/powertracker</project>
  <project EXPORT="discard">[APPS_DIR]/collect-view</project>
  <project EXPORT="discard">[APPS_DIR]/serial_socket</project>

  <!-- Simulation Configuration -->
  <simulation>
    <title>Blockchain_IoT_Sim</title>
    <randomseed>987654</randomseed>
    <motedelay_us>1000000</motedelay_us>
    <radiomedium>
      org.contikios.cooja.radiomediums.UDGM
      <transmitting_range>75.0</transmitting_range>
      <interference_range>100.0</interference_range>
      <success_ratio_tx>0.9</success_ratio_tx>
      <success_ratio_rx>0.9</success_ratio_rx>
    </radiomedium>

    <events>
      <logoutput>60000</logoutput>
    </events>

    <!-- Sensor Nodes -->
    <!-- Availability Sensor -->
    <motetype>
      org.contikios.cooja.mspmote.Z1MoteType
      <identifier>avail_sensor</identifier>
      <description>Availability Sensor Node</description>
      <source EXPORT="discard">[CONTIKI_DIR]/examples/ipv6/udp-demo/availability-sensor-node.c</source>
      <commands EXPORT="discard">make availability-sensor-node.z1 TARGET=z1</commands>
      <firmware EXPORT="copy">[CONTIKI_DIR]/examples/ipv6/udp-demo/availability-sensor-node.z1</firmware>
      <moteinterface>org.contikios.cooja.interfaces.Position</moteinterface>
      <moteinterface>org.contikios.cooja.interfaces.RimeAddress</moteinterface>
      <moteinterface>org.contikios.cooja.interfaces.IPAddress</moteinterface>
    </motetype>

    <!-- Integrity Sensor -->
    <motetype>
      org.contikios.cooja.mspmote.Z1MoteType
      <identifier>integ_sensor</identifier>
      <description>Integrity Sensor Node</description>
      <source EXPORT="discard">[CONTIKI_DIR]/examples/ipv6/udp-demo/integrity-sensor-node.c</source>
      <commands EXPORT="discard">make integrity-sensor-node.z1 TARGET=z1</commands>
      <firmware EXPORT="copy">[CONTIKI_DIR]/examples/ipv6/udp-demo/integrity-sensor-node.z1</firmware>
      <moteinterface>org.contikios.cooja.interfaces.Position</moteinterface>
      <moteinterface>org.contikios.cooja.interfaces.RimeAddress</moteinterface>
      <moteinterface>org.contikios.cooja.interfaces.IPAddress</moteinterface>
    </motetype>

    <!-- Security Sensor -->
    <motetype>
      org.contikios.cooja.mspmote.Z1MoteType
      <identifier>sec_sensor</identifier>
      <description>Security Sensor Node</description>
      <source EXPORT="discard">[CONTIKI_DIR]/examples/ipv6/udp-demo/security-sensor-node.c</source>
      <commands EXPORT="discard">make security-sensor-node.z1 TARGET=z1</commands>
      <firmware EXPORT="copy">[CONTIKI_DIR]/examples/ipv6/udp-demo/security-sensor-node.z1</firmware>
      <moteinterface>org.contikios.cooja.interfaces.Position</moteinterface>
      <moteinterface>org.contikios.cooja.interfaces.RimeAddress</moteinterface>
      <moteinterface>org.contikios.cooja.interfaces.IPAddress</moteinterface>
    </motetype>

    <!-- Mobility Sensor -->
    <motetype>
      org.contikios.cooja.mspmote.Z1MoteType
      <identifier>mobility_sensor</identifier>
      <description>Mobility Sensor Node</description>
      <source EXPORT="discard">[CONTIKI_DIR]/examples/ipv6/udp-demo/mobility-sensor-node.c</source>
      <commands EXPORT="discard">make mobility-sensor-node.z1 TARGET=z1</commands>
      <firmware EXPORT="copy">[CONTIKI_DIR]/examples/ipv6/udp-demo/mobility-sensor-node.z1</firmware>
      <moteinterface>org.contikios.cooja.interfaces.Position</moteinterface>
      <moteinterface>org.contikios.cooja.interfaces.RimeAddress</moteinterface>
      <moteinterface>org.contikios.cooja.interfaces.IPAddress</moteinterface>
    </motetype>

    <!-- Border Router -->
    <motetype>
      org.contikios.cooja.mspmote.Z1MoteType
      <identifier>border_router</identifier>
      <description>RPL Border Router</description>
      <firmware EXPORT="copy">[CONTIKI_DIR]/examples/ipv6/rpl-border-router/border-router.z1</firmware>
      <moteinterface>org.contikios.cooja.interfaces.Position</moteinterface>
      <moteinterface>org.contikios.cooja.interfaces.RimeAddress</moteinterface>
      <moteinterface>org.contikios.cooja.interfaces.IPAddress</moteinterface>
    </motetype>

    <!-- Sensor Nodes Instances -->
    <mote>
      <motetype_identifier>avail_sensor</motetype_identifier>
      <interface_config>
        org.contikios.cooja.interfaces.Position
        <x>50</x>
        <y>100</y>
        <z>0</z>
      </interface_config>
    </mote>
    <mote>
      <motetype_identifier>integ_sensor</motetype_identifier>
      <interface_config>
        org.contikios.cooja.interfaces.Position
        <x>60</x>
        <y>200</y>
        <z>0</z>
      </interface_config>
    </mote>

    <!-- Repeated Sensors -->
    <mote>
      <motetype_identifier>sec_sensor</motetype_identifier>
      <interface_config>
        org.contikios.cooja.interfaces.Position
        <x>100</x>
        <y>100</y>
        <z>0</z>
      </interface_config>
    </mote>
    <mote>
      <motetype_identifier>mobility_sensor</motetype_identifier>
      <interface_config>
        org.contikios.cooja.interfaces.Position
        <x>150</x>
        <y>150</y>
        <z>0</z>
      </interface_config>
    </mote>

  </simulation>

  <!-- Plugins -->
  <plugin>
    org.contikios.cooja.plugins.Visualizer
    <plugin_config>
      <skin>org.contikios.cooja.plugins.skins.IDVisualizerSkin</skin>
      <skin>org.contikios.cooja.plugins.skins.GridVisualizerSkin</skin>
      <skin>org.contikios.cooja.plugins.skins.TrafficVisualizerSkin</skin>
    </plugin_config>
    <width>500</width>
    <height>400</height>
    <location_x>50</location_x>
    <location_y>50</location_y>
  </plugin>

  <plugin>
    org.contikios.cooja.plugins.LogListener
    <plugin_config>
      <filter />
    </plugin_config>
    <width>800</width>
    <height>200</height>
  </plugin>
</simconf>
