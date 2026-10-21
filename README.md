# Timely

A React Native (Expo) app for comparing time zones and finding a time that works for everyone. Add the people or places you keep in touch with, along with their time zone and usual sleep hours, and Timely shows when each one is awake and when everyone overlaps.

## Two views

- **Cylinder:** each place is a rotating 24-hour cylinder. Set the time for one place and the others show what time it is there, with day and night shading.
- **Map:** each place is a 24-hour timeline, stacked one above the other. Sleep hours are shaded red, and the hours when nobody is asleep are highlighted green, so the best shared time stands out.

## Features

- Add a place with a name, a UTC offset, and bed and wake times, using custom scrolling hour pickers
- Save groups of places as presets and switch between them; long-press a preset to rename or delete it
- Edit or remove places from the map view
- An animated intro screen and a help screen for each view

## Tech

React Native, Expo (SDK 54), Expo Router, TypeScript, React Native Reanimated and react-native-svg. Both views read from the same shared state through a React context.

## Status

Not under active development. Places and presets are kept in memory, so they reset when the app restarts, and time zones are whole-hour UTC offsets (-12 to +12).

## Running it

```bash
cd timely
npm install
npx expo start
```

Press `w` to open it in a browser, or open it with an Expo Go version that supports SDK 54.
