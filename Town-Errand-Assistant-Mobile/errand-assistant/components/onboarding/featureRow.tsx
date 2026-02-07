import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function FeatureRow({
    icon,
    text,
    color,
    textColor,
}:{
    icon: React.ComponentProps<typeof Ionicons>["name"];
    text:string;
    color:string;
    textColor:string;
}){

    return(
        <View style={styles.row}>
            <Ionicons name={icon} size={14} color={color} />
            <Text style={[styles.text, {color: textColor}]}>{text}</Text>
        </View>
    );
}


const styles = StyleSheet.create({
  row:{
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: 6 
},
  text:{ 
    marginLeft: 8, 
    fontSize: 13, 
    fontWeight: '500', 
},
});