# EspecialidadeCombobox Test Specification

## Component Overview
The `EspecialidadeCombobox` component provides a searchable dropdown for selecting medical specialties (especialidades) using shadcn/ui Command + Popover pattern.

## Test Suite: EspecialidadeCombobox

### Unit Tests

#### Test 1: Component Rendering
**Description**: Verify component renders with default state
**Steps**:
1. Render EspecialidadeCombobox without selected value
2. Verify "Selecionar especialidade..." placeholder is displayed
3. Verify button is clickable

**Expected Result**: Component renders with placeholder text and closed popover

---

#### Test 2: Data Loading State
**Description**: Verify loading state displays correctly
**Steps**:
1. Mock useEspecialidades hook to return `isLoading: true`
2. Render component
3. Check for loading spinner or loading text

**Expected Result**: Loading indicator is visible while data is being fetched

---

#### Test 3: Error State Handling
**Description**: Verify error state displays correctly
**Steps**:
1. Mock useEspecialidades hook to return error
2. Render component
3. Verify error message is displayed

**Expected Result**: Error message "Erro ao carregar especialidades" is shown

---

#### Test 4: Empty State
**Description**: Verify empty state when no especialidades exist
**Steps**:
1. Mock useEspecialidades to return empty array
2. Open popover
3. Verify "Nenhuma especialidade encontrada" message displays

**Expected Result**: Empty state message is shown

---

#### Test 5: Especialidades List Display
**Description**: Verify especialidades are displayed correctly
**Steps**:
1. Mock useEspecialidades with 5 test especialidades
2. Open popover
3. Verify all 5 especialidades are listed

**Expected Result**: All especialidades from mock data are rendered in the list

---

#### Test 6: Search Functionality
**Description**: Verify search filters especialidades
**Steps**:
1. Mock useEspecialidades with ["Cardiologia", "Neurologia", "Pediatria"]
2. Open popover
3. Type "cardio" in search input
4. Verify only "Cardiologia" is shown

**Expected Result**: Search filters list to matching especialidades

---

#### Test 7: Selection Updates Value
**Description**: Verify selecting an especialidade calls onChange
**Steps**:
1. Mock useEspecialidades with test data
2. Render component with onChange handler
3. Open popover and click "Cardiologia"
4. Verify onChange was called with Cardiologia's UUID

**Expected Result**: onChange callback receives correct especialidade_id

---

#### Test 8: Selected Value Display
**Description**: Verify selected especialidade is displayed
**Steps**:
1. Mock useEspecialidades with test data
2. Render component with value prop set to Cardiologia UUID
3. Verify button shows "Cardiologia" instead of placeholder

**Expected Result**: Selected especialidade name is displayed on button

---

#### Test 9: Checkmark on Selected Item
**Description**: Verify selected item shows checkmark
**Steps**:
1. Mock useEspecialidades with test data
2. Render component with value="uuid-cardio"
3. Open popover
4. Verify Cardiologia item has checkmark icon

**Expected Result**: Checkmark icon (CheckIcon) is visible next to selected item

---

#### Test 10: Server-Side Search
**Description**: Verify search query is passed to useEspecialidades hook
**Steps**:
1. Render component
2. Open popover
3. Type "neuro" in search input
4. Verify useEspecialidades was called with search="neuro"

**Expected Result**: Hook receives search parameter for server-side filtering

---

### Integration Tests

#### Integration Test 1: Form Integration
**Description**: Verify component works with react-hook-form
**Steps**:
1. Create form with EspecialidadeCombobox using FormField
2. Select an especialidade
3. Submit form
4. Verify form data includes especialidade_id

**Expected Result**: Selected especialidade_id is included in form submission

---

#### Integration Test 2: Validation Integration
**Description**: Verify component displays validation errors
**Steps**:
1. Create form with especialidade_id as required field
2. Render EspecialidadeCombobox with FormMessage
3. Submit form without selecting especialidade
4. Verify "Especialidade é obrigatória" error displays

**Expected Result**: Validation error message is shown below component

---

### Edge Cases

#### Edge Case 1: Long Especialidade Names
**Description**: Verify long names are handled gracefully
**Steps**:
1. Mock especialidade with 100-character name
2. Render component with selected value
3. Verify text doesn't overflow container

**Expected Result**: Long names are truncated with ellipsis

---

#### Edge Case 2: Special Characters in Search
**Description**: Verify search handles special characters
**Steps**:
1. Type "cardio/neuro" in search
2. Verify no errors occur

**Expected Result**: Search handles special characters without errors

---

#### Edge Case 3: Rapid Search Input
**Description**: Verify debouncing works correctly
**Steps**:
1. Type "car" quickly in search input
2. Verify useEspecialidades is called only once after debounce

**Expected Result**: Server requests are debounced to prevent excessive API calls

---

## Test Coverage Goals
- ✅ Component renders in all states (loading, error, empty, populated)
- ✅ User interactions work correctly (open, search, select, close)
- ✅ Form integration works with validation
- ✅ Edge cases are handled gracefully
- ✅ Accessibility: keyboard navigation works
- ✅ Accessibility: screen readers can navigate options

## Manual Testing Checklist
- [ ] Component opens on click
- [ ] Search input receives focus when opened
- [ ] Typing filters results in real-time
- [ ] Clicking especialidade closes popover and updates value
- [ ] ESC key closes popover
- [ ] Tab navigation works correctly
- [ ] Component works on mobile devices
- [ ] Component respects disabled state
