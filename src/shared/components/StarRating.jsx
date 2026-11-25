import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";

// Constantes predeterminadas para presentación visual de estrellas
const DEFAULT_MAX_STARS = 5;
const DEFAULT_STAR_SIZE = 24;
const DEFAULT_ACTIVE_COLOR = "#FFC107";
const DEFAULT_INACTIVE_COLOR = "#CBD5E1";

/**
 * Componente transversal para renderizado de calificaciones con estrellas.
 * Soporta tanto modo interactivo (onRateChange proporcionado) como modo solo lectura.
 */
export default function StarRating({
  rating = 5,
  maxStars = DEFAULT_MAX_STARS,
  size = DEFAULT_STAR_SIZE,
  activeColor = DEFAULT_ACTIVE_COLOR,
  inactiveColor = DEFAULT_INACTIVE_COLOR,
  onRateChange = null,
  containerStyle = null,
  starStyle = null,
  iconFamily = "MaterialCommunityIcons",
}) {
  const roundedRating = Math.round(Number(rating || 0));
  const isInteractive = typeof onRateChange === "function";

  const starNumbersList = [];
  for (let starNumber = 1; starNumber <= maxStars; starNumber++) {
    starNumbersList.push(starNumber);
  }

  const renderStarIcon = (starNumber) => {
    const isStarActive = starNumber <= roundedRating;
    const starColor = isStarActive ? activeColor : inactiveColor;

    if (iconFamily === "FontAwesome") {
      return (
        <FontAwesome
          name={isStarActive ? "star" : "star-o"}
          size={size}
          color={starColor}
          style={starStyle}
        />
      );
    }

    return (
      <MaterialCommunityIcons
        name={isStarActive ? "star" : "star-outline"}
        size={size}
        color={starColor}
        style={starStyle}
      />
    );
  };

  return (
    <View style={[styles.defaultContainer, containerStyle]}>
      {starNumbersList.map((starNumber) => {
        if (isInteractive) {
          return (
            <TouchableOpacity
              key={starNumber}
              onPress={() => onRateChange(starNumber)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Calificar con ${starNumber} estrellas`}
            >
              {renderStarIcon(starNumber)}
            </TouchableOpacity>
          );
        }

        return (
          <View key={starNumber} accessible={false}>
            {renderStarIcon(starNumber)}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  defaultContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});
