import { Tabs } from "expo-router";
import React from "react";
import { StatusBar } from "expo-status-bar";
import Entypo from '@expo/vector-icons/Entypo';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function RootLayout() {
    return (
        <React.Fragment>
            <StatusBar style="auto" />
                <Tabs>
                    <Tabs.Screen 
                        name="(home)" 
                        options={
                            { 
                                title: "Página de Inicio",
                                headerShown: false,
                                tabBarIcon: ({color, size}) => <Entypo name="home" size={size} color={color} />,                                
                            }
                        } 
                    />  
                    <Tabs.Screen 
                        name="settings" 
                        options={
                            { 
                                title: "Configuración",
                                tabBarIcon: ({color,size}) => <Ionicons name="settings" size={size} color={color} />
                            }
                        } 
                    />
                </Tabs>
        </React.Fragment>
    );
}