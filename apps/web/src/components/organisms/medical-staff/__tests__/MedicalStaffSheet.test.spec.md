# MedicalStaffSheet Test Specification

## Component Overview
The `MedicalStaffSheet` component is a form sheet for creating and editing medical staff members. It uses the new `especialidade_id` foreign key field with the `EspecialidadeCombobox` component.

## Test Suite: MedicalStaffSheet

### Unit Tests - Form Rendering

#### Test 1: Create Mode Initial State
**Description**: Verify form renders in create mode with default values
**Steps**:
1. Render MedicalStaffSheet with isOpen=true, staffToEdit=null
2. Verify form title is "Novo Profissional"
3. Verify all fields are empty
4. Verify Submit button says "Cadastrar Profissional"

**Expected Result**: Form renders in create mode with empty fields

---

#### Test 2: Edit Mode Initial State
**Description**: Verify form populates with existing staff data in edit mode
**Steps**:
1. Mock staffToEdit with complete data including especialidade_id
2. Render MedicalStaffSheet with staffToEdit prop
3. Verify form title is "Editar Profissional"
4. Verify all fields are populated with staff data
5. Verify EspecialidadeCombobox shows selected especialidade name

**Expected Result**: Form renders in edit mode with pre-filled data

---

### Unit Tests - Especialidade Field

#### Test 3: Especialidade Field is Required
**Description**: Verify especialidade_id field has required validation
**Steps**:
1. Render form in create mode
2. Fill all fields except especialidade_id
3. Submit form
4. Verify validation error "Especialidade é obrigatória" appears

**Expected Result**: Form validation prevents submission without especialidade

---

#### Test 4: Especialidade Selection Updates Form
**Description**: Verify selecting especialidade updates form state
**Steps**:
1. Render form in create mode
2. Open EspecialidadeCombobox
3. Select "Cardiologia"
4. Verify form value for especialidade_id is updated to Cardiologia's UUID

**Expected Result**: Form state updates with selected especialidade_id

---

#### Test 5: Especialidade Display in Edit Mode
**Description**: Verify especialidade displays correctly when editing
**Steps**:
1. Mock staffToEdit with especialidade_id = "uuid-cardio"
2. Mock useEspecialidades to return Cardiologia with matching UUID
3. Render form
4. Verify EspecialidadeCombobox displays "Cardiologia"

**Expected Result**: Correct especialidade name is displayed in edit mode

---

### Integration Tests - Data Flow

#### Integration Test 1: Create Staff with Especialidade
**Description**: Verify creating staff sends especialidade_id to database
**Steps**:
1. Fill form with name, role, color, and especialidade_id
2. Submit form
3. Verify Supabase insert is called with especialidade_id field
4. Verify NO specialty text field is sent

**Expected Result**: Only especialidade_id is sent, not deprecated specialty field

---

#### Integration Test 2: Update Staff Especialidade
**Description**: Verify updating staff's especialidade works
**Steps**:
1. Render form with staffToEdit (especialidade="Cardiologia")
2. Change especialidade to "Neurologia"
3. Submit form
4. Verify Supabase update is called with new especialidade_id

**Expected Result**: Database is updated with new especialidade_id

---

#### Integration Test 3: CRM Search with Especialidade
**Description**: Verify CRM search shows especialidade of found staff
**Steps**:
1. Render form in create mode
2. Type CRM "1234/SP"
3. Mock Supabase to return existing staff with especialidade data
4. Verify alert shows staff name with especialidade: "Dr. João (Médico) • Cardiologia"

**Expected Result**: Existing staff's especialidade is displayed in match alert

---

### Integration Tests - Form Submission

#### Integration Test 4: Submit with All Required Fields
**Description**: Verify form submits successfully with especialidade_id
**Steps**:
1. Fill all required fields including especialidade_id
2. Submit form
3. Verify no validation errors
4. Verify onSuccess callback is called
5. Verify form closes

**Expected Result**: Form submits successfully and closes

---

#### Integration Test 5: Edit Mode Preserves Especialidade
**Description**: Verify editing staff preserves especialidade if not changed
**Steps**:
1. Render form with staffToEdit (especialidade_id="uuid-cardio")
2. Change only the name field
3. Submit form
4. Verify update includes unchanged especialidade_id

**Expected Result**: Unchanged fields including especialidade_id are preserved

---

### Integration Tests - Error Handling

#### Integration Test 6: Handle Especialidade Load Error
**Description**: Verify form handles especialidade loading errors
**Steps**:
1. Mock useEspecialidades to return error
2. Render form
3. Verify EspecialidadeCombobox shows error state
4. Verify user can still interact with other form fields

**Expected Result**: Form remains functional even if especialidades fail to load

---

### Edge Cases

#### Edge Case 1: Switch from Create to Edit Mode
**Description**: Verify form resets correctly when switching modes
**Steps**:
1. Render form in create mode
2. Fill especialidade_id field
3. Close and re-open with staffToEdit prop
4. Verify form shows edit mode data, not previous create mode data

**Expected Result**: Form state resets correctly when switching modes

---

#### Edge Case 2: Missing Especialidade in Database
**Description**: Verify form handles case where especialidade_id reference is broken
**Steps**:
1. Mock staffToEdit with especialidade_id="invalid-uuid"
2. Mock useEspecialidades to not include that UUID
3. Render form
4. Verify form still renders without crashing
5. Verify EspecialidadeCombobox shows placeholder

**Expected Result**: Form handles missing especialidade gracefully

---

#### Edge Case 3: Form Reset After Submission
**Description**: Verify form resets after successful submission
**Steps**:
1. Fill and submit form successfully
2. Re-open form in create mode
3. Verify especialidade_id field is empty
4. Verify no previously selected especialidade is shown

**Expected Result**: Form fields reset to default values

---

### Data Migration Verification Tests

#### Test 7: No Specialty Text Field in Form
**Description**: Verify deprecated specialty field is not in form
**Steps**:
1. Inspect form schema and fields
2. Verify no input field for "specialty" text exists
3. Verify only EspecialidadeCombobox for especialidade_id exists

**Expected Result**: Form only uses especialidade_id, no text specialty field

---

#### Test 8: Database Insert Without Specialty
**Description**: Verify database inserts don't include specialty column
**Steps**:
1. Submit new staff form
2. Intercept Supabase insert call
3. Verify payload does NOT include 'specialty' field
4. Verify payload DOES include 'especialidade_id' field

**Expected Result**: Insert operation uses only especialidade_id

---

#### Test 9: Database Update Without Specialty
**Description**: Verify database updates don't include specialty column
**Steps**:
1. Submit edit form
2. Intercept Supabase update call
3. Verify payload does NOT include 'specialty' field
4. Verify payload DOES include 'especialidade_id' field

**Expected Result**: Update operation uses only especialidade_id

---

## Test Coverage Goals
- ✅ Form renders correctly in create and edit modes
- ✅ All form fields work including especialidade_id
- ✅ Validation works correctly (required fields)
- ✅ Form submission sends correct data structure
- ✅ No references to deprecated specialty text field
- ✅ Error states are handled gracefully
- ✅ Form resets correctly between uses

## Manual Testing Checklist

### Create Mode
- [ ] Open form in create mode
- [ ] Verify "Novo Profissional" title
- [ ] Fill name, email, phone, CRM
- [ ] Select role from dropdown
- [ ] Select color from color picker
- [ ] **Open especialidade combobox**
- [ ] **Search for "cardio"**
- [ ] **Select "Cardiologia"**
- [ ] **Verify "Cardiologia" appears in button**
- [ ] Submit form
- [ ] Verify success toast
- [ ] Verify form closes
- [ ] Open database and verify record has especialidade_id UUID
- [ ] **Verify NO specialty text column exists in database**

### Edit Mode
- [ ] Open form with existing staff member
- [ ] Verify "Editar Profissional" title
- [ ] **Verify especialidade shows correct name (e.g., "Cardiologia")**
- [ ] Change especialidade to different option
- [ ] Submit form
- [ ] Verify database record updated with new especialidade_id

### Validation
- [ ] Try to submit without filling name → see error
- [ ] Try to submit without selecting especialidade → see "Especialidade é obrigatória"
- [ ] Verify invalid email format shows error
- [ ] Verify all required fields validated

### CRM Search (Create Mode)
- [ ] Type existing CRM
- [ ] **Verify found staff shows with especialidade name**
- [ ] Click "Vincular" button
- [ ] Verify staff linked successfully

### Error Scenarios
- [ ] Simulate network error on form submit → verify error toast
- [ ] Simulate especialidades fetch error → verify error state in combobox
- [ ] Simulate duplicate CRM → verify appropriate error message
