# End-User Design System

## Typography

### Font Weights
- **Ultra Light**: `font-extralight` - Large hero headings only
- **Light**: `font-light` - Body text, descriptions, secondary content
- **Medium**: `font-medium` - Labels, small headings, navigation
- **Bold**: `font-bold` - Not used (use `font-black` instead for strong emphasis)
- **Black**: `font-black` - Hero highlights, strong emphasis

### Font Sizes (Mobile-First)
- **Hero Heading**: `text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl`
- **Page Heading**: `text-3xl sm:text-4xl md:text-5xl`
- **Section Heading**: `text-2xl sm:text-3xl`
- **Card Heading**: `text-xl sm:text-2xl`
- **Body Large**: `text-lg sm:text-xl`
- **Body**: `text-base sm:text-lg`
- **Body Small**: `text-sm sm:text-base`
- **Label**: `text-xs uppercase tracking-wider`
- **Caption**: `text-xs`

### Letter Spacing
- **Hero**: `tracking-[-0.02em]` (tight)
- **Labels**: `tracking-wider` (wide)
- **Uppercase Labels**: `tracking-[0.3em]` (extra wide)
- **Body**: Default (no class needed)

## Colors

### Usage
- **Primary Color**: Accents, borders, dividers (use with opacity: 08, 15, 20, 40)
- **Secondary Color**: Buttons, important values, CTAs
- **Accent Color**: Small accents, status indicators
- **Gray Scale**: Content hierarchy

### Dynamic Colors (from mockHeroContent)
```javascript
colorTheme.primary      // Main brand color
colorTheme.secondary    // CTA and emphasis
colorTheme.accent       // Subtle accents
colorTheme.gradientFrom // Gradient start
colorTheme.gradientTo   // Gradient end
```

## Components

### Buttons

#### Primary Button
```html
<button class="px-8 py-4 text-white font-medium text-sm uppercase tracking-wider transition-all hover:shadow-lg"
  :style="{ backgroundColor: colorTheme.secondary }">
  Button Text
</button>
```

#### Secondary Button
```html
<button class="px-8 py-4 bg-white font-medium text-sm uppercase tracking-wider border transition-all hover:shadow-lg"
  :style="{ borderColor: colorTheme.primary, color: colorTheme.secondary }">
  Button Text
</button>
```

#### Ghost Button
```html
<button class="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">
  Button Text
</button>
```

### Form Inputs

#### Minimalist Input (Underline Style)
```html
<div>
  <label class="block text-xs uppercase tracking-wider text-gray-500 mb-2 font-medium">
    Label
  </label>
  <input
    class="w-full px-0 py-3 border-0 border-b-2 border-gray-200 focus:border-gray-900 focus:outline-none transition-colors bg-transparent text-lg font-light"
    :style="{ borderBottomColor: value ? colorTheme.primary : undefined }"
  />
</div>
```

### Cards

#### Minimal Card
```html
<div class="bg-white p-6 space-y-4">
  <!-- No shadows, no rounded corners for minimal design -->
</div>
```

#### Card with Border
```html
<div class="bg-white p-6 border" :style="{ borderColor: `${colorTheme.primary}20` }">
  <!-- Subtle colored border -->
</div>
```

### Dividers

#### Horizontal Line
```html
<div class="h-px" :style="{ backgroundColor: `${colorTheme.primary}40` }"></div>
```

#### Section Divider
```html
<div class="border-t py-6" :style="{ borderColor: `${colorTheme.primary}20` }">
```

### Status Badges
```html
<span class="px-4 py-2 text-xs font-medium uppercase tracking-wide bg-green-100 text-green-800">
  Status
</span>
```

## Layout

### Max Widths
- **Form/Narrow**: `max-w-md` (448px)
- **Content**: `max-w-2xl` (672px)
- **Page**: `max-w-4xl` (896px)
- **Wide**: `max-w-7xl` (1280px)

### Spacing
- **Section Gap**: `space-y-8 sm:space-y-12`
- **Component Gap**: `space-y-4 sm:space-y-6`
- **Element Gap**: `space-y-2 sm:space-y-3`

### Padding
- **Page**: `px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20`
- **Section**: `py-8 sm:py-12 md:py-16`
- **Card**: `p-6 sm:p-8`

## Design Principles

1. **Minimalism**: Clean, white backgrounds. No unnecessary shadows or gradients
2. **Typography-First**: Use font weights and sizes for hierarchy, not colors
3. **Subtle Color**: Brand colors used sparingly with opacity
4. **Generous Spacing**: Let content breathe
5. **Sharp Edges**: Minimal to no rounded corners (max `rounded-sm`)
6. **Light Font Weights**: Prefer `font-light` and `font-extralight` for modern feel

## Animation

### Transitions
- **Standard**: `transition-all duration-300`
- **Fast**: `transition-colors duration-200`
- **Smooth**: `transition-all duration-500`

### Hover Effects
- **Buttons**: `hover:shadow-lg`
- **Icons**: `group-hover:translate-x-1` or `group-hover:scale-110`
- **Links**: `hover:text-gray-900`

## Consistency Checklist

- [ ] All headings use extralight/light weights
- [ ] All buttons have uppercase text with wide tracking
- [ ] All labels are uppercase with `text-xs`
- [ ] All cards have minimal/no shadows
- [ ] All form inputs use underline style
- [ ] All colors use dynamic theme colors
- [ ] All spacing uses consistent scale
- [ ] All animations are subtle and purposeful
