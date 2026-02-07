import React from "react";
import { StyleSheet, View } from "react-native";

export function ProgressDots({
    index,
    total,
    activeColor,
}:{
    index:number;
    total:number;
    activeColor:string;
}) {
    return(
        <View style={styles.progress}>
            {Array.from({ length: total }).map((_, i) => (
                <View
                    key={i}
                    style={[
                        styles.dot,
                        i === index && {...styles.dotActive, backgroundColor: activeColor },
                    ]}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    progress:{ 
        flexDirection: 'row', 
        marginBottom: 14, 
        alignItems: 'center',
    },
    dot:{
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
    },
    dotActive:{
    width: 16,
    height: 8,
    borderRadius: 4,
    },
});