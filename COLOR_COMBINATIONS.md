# Azia Admin Panel - Color Combinations Reference

This document lists all color combinations used in the Azia Admin Panel, based on the dashboard design image.

## 🎨 PRIMARY COLORS

### Purple (`#6F42C1`)
- **Usage**: Main brand color, primary buttons, headers, navigation
- **Hover**: `#5a32a3`
- **RGBA for shadows**: `rgba(111, 66, 193, 0.1)` to `rgba(111, 66, 193, 0.2)`
- **CSS Variable**: `--azia-primary-purple`

### Blue (`#007BFF`)
- **Usage**: Secondary actions, info buttons, charts
- **Hover**: `#0056b3`
- **RGBA for shadows**: `rgba(0, 123, 255, 0.1)` to `rgba(0, 123, 255, 0.15)`
- **CSS Variable**: `--azia-primary-blue`

---

## 🎨 SUPPORTING COLORS

### Teal (`#00CCCC`)
- **Usage**: Success states, positive indicators, accent elements
- **Hover**: `#00b3b3`
- **RGBA for backgrounds**: `rgba(0, 204, 204, 0.1)`
- **CSS Variable**: `--azia-teal`

### Cyan (`#0DCAF0`)
- **Usage**: Additional accent color, highlights
- **Hover**: `#0bb5d8`
- **RGBA for backgrounds**: `rgba(13, 202, 240, 0.1)`
- **CSS Variable**: `--azia-cyan`

### Blue-Green (`#17A2B8`)
- **Usage**: Secondary buttons, cancel actions, tertiary elements
- **Hover**: `#138496`
- **RGBA for backgrounds**: `rgba(23, 162, 184, 0.1)`
- **CSS Variable**: `--azia-blue-green`

---

## 🎨 BACKGROUND COLORS

### White (`#FFFFFF`)
- **Usage**: Main background, card backgrounds
- **CSS Variable**: `--azia-bg-white`

### Light Gray (`#F8F9FA`)
- **Usage**: Secondary backgrounds, subtle sections
- **CSS Variable**: `--azia-bg-light`

### Lighter Gray (`#F5F5F5`)
- **Usage**: Very subtle backgrounds
- **CSS Variable**: `--azia-bg-lighter`

---

## 🎨 TEXT COLORS

### Dark Text (`#212529`)
- **Usage**: Primary text content
- **CSS Variable**: `--azia-text-dark`

### Muted Text (`#6C757D`)
- **Usage**: Secondary text, labels
- **CSS Variable**: `--azia-text-muted`

### Light Text (`#ADB5BD`)
- **Usage**: Tertiary text, placeholders
- **CSS Variable**: `--azia-text-light`

### White Text (`#FFFFFF`)
- **Usage**: Text on colored backgrounds
- **CSS Variable**: `--azia-text-white`

---

## 🎨 BORDER COLORS

### Light Border (`#E9ECEF`)
- **Usage**: Card borders, subtle dividers
- **CSS Variable**: `--azia-border-light`

### Medium Border (`#DEE2E6`)
- **Usage**: Table borders, form borders
- **CSS Variable**: `--azia-border-medium`

---

## 📋 COLOR COMBINATIONS BY COMPONENT

### Buttons

#### Primary Button (Purple)
```css
Background: #6F42C1
Text: #FFFFFF
Hover: #5a32a3
Border: #6F42C1
```

#### Info Button (Blue)
```css
Background: #007BFF
Text: #FFFFFF
Hover: #0056b3
Border: #007BFF
```

#### Success Button (Teal)
```css
Background: #00CCCC
Text: #FFFFFF
Hover: #00b3b3
Border: #00CCCC
```

#### Secondary Button (Blue-Green)
```css
Background: #17A2B8
Text: #FFFFFF
Hover: #138496
Border: #17A2B8
```

### Cards

#### Card Header (Purple)
```css
Background: #6F42C1
Text: #FFFFFF
Border: none
```

#### Card Header (Blue)
```css
Background: #007BFF
Text: #FFFFFF
Border: none
```

#### Card Header (Teal)
```css
Background: #00CCCC
Text: #FFFFFF
Border: none
```

### Tables

#### Table Header (Purple)
```css
Background: #6F42C1
Text: #FFFFFF
Border: none
```

#### Table Striped Rows
```css
Odd rows: rgba(111, 66, 193, 0.05)
Hover: rgba(111, 66, 193, 0.1)
```

### Badges

#### Primary Badge
```css
Background: #6F42C1
Text: #FFFFFF
```

#### Info Badge
```css
Background: #007BFF
Text: #FFFFFF
```

#### Success Badge
```css
Background: #00CCCC
Text: #FFFFFF
```

### Alerts

#### Primary Alert
```css
Background: rgba(111, 66, 193, 0.1)
Border: #6F42C1
Text: #6F42C1
```

#### Info Alert
```css
Background: rgba(0, 123, 255, 0.1)
Border: #007BFF
Text: #007BFF
```

#### Success Alert
```css
Background: rgba(0, 204, 204, 0.1)
Border: #00CCCC
Text: #00CCCC
```

### Navigation/Sidebar

#### Sidebar Background
```css
Gradient: linear-gradient(180deg, #6F42C1 0%, #5a32a3 100%)
Text: #FFFFFF
Shadow: rgba(111, 66, 193, 0.15)
```

#### Active Nav Link
```css
Background: rgba(255, 255, 255, 0.2)
Text: #FFFFFF
```

#### Hover Nav Link
```css
Background: rgba(255, 255, 255, 0.15)
Text: #FFFFFF
```

### Forms

#### Focused Input
```css
Border: #6F42C1
Shadow: rgba(111, 66, 193, 0.25)
```

#### Checked Checkbox
```css
Background: #6F42C1
Border: #6F42C1
```

### Shadows

#### Small Shadow
```css
box-shadow: 0 2px 4px rgba(111, 66, 193, 0.1);
```

#### Medium Shadow
```css
box-shadow: 0 4px 12px rgba(111, 66, 193, 0.15);
```

#### Large Shadow
```css
box-shadow: 0 8px 24px rgba(111, 66, 193, 0.2);
```

---

## 📝 USAGE GUIDELINES

1. **Primary Purple (`#6F42C1`)**: Use for main actions, headers, navigation, and primary brand elements
2. **Primary Blue (`#007BFF`)**: Use for secondary actions, info states, and charts
3. **Teal (`#00CCCC`)**: Use for success states, positive indicators, and accent highlights
4. **Cyan (`#0DCAF0`)**: Use for additional accents and highlights
5. **Blue-Green (`#17A2B8`)**: Use for secondary buttons and cancel actions

**Important**: Only use these 5 colors from the image. Do not use any other colors.

---

## 🔧 CSS Variables

All colors are available as CSS variables in `src/styles/azia-colors.css`:

```css
--azia-primary-purple: #6F42C1;
--azia-primary-blue: #007BFF;
--azia-teal: #00CCCC;
--azia-cyan: #0DCAF0;
--azia-blue-green: #17A2B8;
```

Use these variables in your components for consistency.

