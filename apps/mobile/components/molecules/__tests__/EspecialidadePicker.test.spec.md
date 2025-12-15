# EspecialidadePicker Test Specification (Mobile)

## Component Overview
The `EspecialidadePicker` component provides a platform-appropriate picker for selecting medical specialties on mobile devices. Uses ActionSheetIOS on iOS and Modal with searchable FlatList on Android.

## Test Suite: EspecialidadePicker

### Unit Tests - Platform: iOS

#### Test 1: iOS Action Sheet Display
**Description**: Verify iOS shows ActionSheetIOS when tapped
**Steps**:
1. Mock Platform.OS = 'ios'
2. Render EspecialidadePicker
3. Tap the input-like touchable field
4. Verify ActionSheetIOS.showActionSheetWithOptions is called

**Expected Result**: iOS action sheet opens with especialidades list

---

#### Test 2: iOS Action Sheet Options
**Description**: Verify action sheet includes all especialidades
**Steps**:
1. Mock useEspecialidades to return ["Cardiologia", "Neurologia", "Pediatria"]
2. Tap picker on iOS
3. Verify action sheet options = ["Cancelar", "Cardiologia", "Neurologia", "Pediatria"]

**Expected Result**: All especialidades appear in action sheet with cancel option

---

#### Test 3: iOS Selection Callback
**Description**: Verify selecting option calls onValueChange
**Steps**:
1. Render with onValueChange mock
2. Open action sheet
3. Select "Cardiologia" (buttonIndex = 1)
4. Verify onValueChange called with Cardiologia UUID

**Expected Result**: onValueChange receives correct especialidade_id

---

#### Test 4: iOS Cancel Action
**Description**: Verify cancel button doesn't trigger onValueChange
**Steps**:
1. Render with onValueChange mock
2. Open action sheet
3. Tap "Cancelar" (buttonIndex = 0)
4. Verify onValueChange NOT called

**Expected Result**: Cancel closes sheet without changing value

---

### Unit Tests - Platform: Android

#### Test 5: Android Modal Display
**Description**: Verify Android shows modal when tapped
**Steps**:
1. Mock Platform.OS = 'android'
2. Render EspecialidadePicker
3. Tap the input-like touchable field
4. Verify Modal visible prop becomes true

**Expected Result**: Modal opens with especialidades list

---

#### Test 6: Android Search Input
**Description**: Verify search input filters list
**Steps**:
1. Mock useEspecialidades with multiple especialidades
2. Open modal on Android
3. Type "cardio" in search Input
4. Verify FlatList shows only matching especialidades

**Expected Result**: List is filtered to show only "Cardiologia"

---

#### Test 7: Android List Item Selection
**Description**: Verify tapping list item updates value
**Steps**:
1. Render with onValueChange mock
2. Open modal
3. Tap "Neurologia" in FlatList
4. Verify onValueChange called with Neurologia UUID
5. Verify modal closes

**Expected Result**: Selection updates value and closes modal

---

#### Test 8: Android Checkmark on Selected Item
**Description**: Verify selected item shows checkmark
**Steps**:
1. Render with value="uuid-cardio"
2. Open modal
3. Verify "Cardiologia" list item has checkmark icon
4. Verify other items don't have checkmark

**Expected Result**: Only selected item shows checkmark

---

#### Test 9: Android Empty Search Results
**Description**: Verify empty state when search has no matches
**Steps**:
1. Open modal
2. Type "zzzzz" in search
3. Verify empty state with "Nenhuma especialidade encontrada" message

**Expected Result**: Empty state displays with search icon and message

---

### Unit Tests - Common (Both Platforms)

#### Test 10: Display Selected Value
**Description**: Verify selected especialidade name is displayed
**Steps**:
1. Mock useEspecialidades with test data
2. Render with value="uuid-neuro"
3. Verify text shows "Neurologia" instead of placeholder

**Expected Result**: Selected especialidade name is displayed

---

#### Test 11: Display Placeholder
**Description**: Verify placeholder shows when no value selected
**Steps**:
1. Render without value prop
2. Verify text shows "Selecione uma especialidade"

**Expected Result**: Placeholder text is displayed

---

#### Test 12: Loading State
**Description**: Verify loading indicator displays while fetching
**Steps**:
1. Mock useEspecialidades with isLoading=true
2. Render component
3. Verify ActivityIndicator is visible
4. Verify "Carregando especialidades..." text appears

**Expected Result**: Loading state displays correctly

---

#### Test 13: Error State
**Description**: Verify error state displays and allows retry
**Steps**:
1. Mock useEspecialidades with fetchError
2. Render component
3. Verify error icon (alert-circle) is visible
4. Verify "Erro ao carregar. Toque para tentar novamente." message
5. Tap error container
6. Verify refetch() is called

**Expected Result**: Error state allows user to retry fetch

---

#### Test 14: Disabled State
**Description**: Verify component respects disabled prop
**Steps**:
1. Render with disabled=true
2. Tap the field
3. Verify picker doesn't open (modal/action sheet not shown)

**Expected Result**: Disabled component doesn't respond to taps

---

#### Test 15: Icon Display
**Description**: Verify medical kit icon and chevron are displayed
**Steps**:
1. Render component
2. Verify medkit icon (Ionicons) is on left
3. Verify chevron-down icon is on right

**Expected Result**: Both icons are visible in correct positions

---

### Integration Tests

#### Integration Test 1: Form Integration with react-hook-form
**Description**: Verify component works with mobile form libraries
**Steps**:
1. Create form with Controller wrapping EspecialidadePicker
2. Select especialidade
3. Submit form
4. Verify form data includes especialidade_id

**Expected Result**: Selected value integrates with form state

---

#### Integration Test 2: Validation Error Display
**Description**: Verify validation errors display below picker
**Steps**:
1. Render with error="Especialidade é obrigatória"
2. Verify error text is displayed in red
3. Verify input has red border (inputError style)

**Expected Result**: Validation errors are displayed correctly

---

#### Integration Test 3: onBlur Callback
**Description**: Verify onBlur is called after selection
**Steps**:
1. Render with onBlur mock
2. Select an especialidade
3. Verify onBlur was called

**Expected Result**: onBlur callback fires after selection

---

### Edge Cases

#### Edge Case 1: Very Long Especialidade Name
**Description**: Verify long names don't break layout
**Steps**:
1. Mock especialidade with 80-character name
2. Select it
3. Verify text is truncated with ellipsis (numberOfLines={1})

**Expected Result**: Long names are truncated gracefully

---

#### Edge Case 2: Empty Especialidades List
**Description**: Verify behavior with no especialidades
**Steps**:
1. Mock useEspecialidades to return empty array
2. Open picker
3. Verify empty state message appears

**Expected Result**: User sees "Nenhuma especialidade encontrada"

---

#### Edge Case 3: Label and Custom Placeholder
**Description**: Verify custom props work correctly
**Steps**:
1. Render with label="Área médica" and placeholder="Escolha a área"
2. Verify label text appears above picker
3. Verify custom placeholder shows when no value

**Expected Result**: Custom label and placeholder are displayed

---

#### Edge Case 4: Container Style Customization
**Description**: Verify containerStyle prop is applied
**Steps**:
1. Render with containerStyle={{ marginBottom: 32 }}
2. Verify style is applied to container View

**Expected Result**: Custom styles are applied correctly

---

### Accessibility Tests

#### Accessibility Test 1: Screen Reader Support
**Description**: Verify component is accessible to screen readers
**Steps**:
1. Enable screen reader (TalkBack/VoiceOver)
2. Focus on picker
3. Verify component announces selected value or placeholder
4. Verify user can navigate and select options

**Expected Result**: Component is fully accessible

---

#### Accessibility Test 2: Touch Target Size
**Description**: Verify touchable area is large enough (44x44 minimum)
**Steps**:
1. Render component
2. Measure TouchableOpacity dimensions
3. Verify height ≥ 44 points

**Expected Result**: Touch target meets accessibility guidelines

---

## Test Coverage Goals
- ✅ Platform-specific behavior (iOS ActionSheet vs Android Modal)
- ✅ Loading, error, and empty states
- ✅ Search functionality (Android)
- ✅ Selection updates value correctly
- ✅ Disabled state prevents interaction
- ✅ Form integration works
- ✅ Validation error display
- ✅ Edge cases handled gracefully
- ✅ Accessibility requirements met

## Manual Testing Checklist

### iOS Device
- [ ] Open form with EspecialidadePicker
- [ ] Tap picker field
- [ ] Verify iOS action sheet appears from bottom
- [ ] Scroll through especialidades list
- [ ] Select "Cardiologia"
- [ ] Verify picker shows "Cardiologia"
- [ ] Tap again and select "Cancelar"
- [ ] Verify value doesn't change

### Android Device
- [ ] Open form with EspecialidadePicker
- [ ] Tap picker field
- [ ] Verify modal slides up from bottom
- [ ] Verify search input is auto-focused
- [ ] Type "neuro" in search
- [ ] Verify only "Neurologia" appears
- [ ] Clear search
- [ ] Tap "Cardiologia"
- [ ] Verify modal closes
- [ ] Verify picker shows "Cardiologia" with checkmark

### Both Platforms
- [ ] Verify medkit icon appears on left
- [ ] Verify chevron-down icon appears on right
- [ ] Test disabled state (field should not open)
- [ ] Test with validation error (red border, error text below)
- [ ] Simulate network error (verify error state with retry option)
- [ ] Test loading state (spinner + loading text)
- [ ] Verify selected value persists across screen navigation

### Form Integration
- [ ] Fill medical staff registration form
- [ ] Select especialidade
- [ ] Submit form
- [ ] Verify database record has especialidade_id UUID
- [ ] **Verify NO specialty text field in mobile forms**
- [ ] Edit existing staff
- [ ] Verify especialidade picker shows current value
- [ ] Change especialidade and save
- [ ] Verify update successful
