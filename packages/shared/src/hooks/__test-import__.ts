/**
 * Test file to verify hook imports are working correctly
 * This file is used during development to verify TypeScript compilation
 */

// Test importing from the main package index
import { useEspecialidades, type UseEspecialidadesOptions, type UseEspecialidadesResult } from '../index';

// Test importing from the hooks index
import { useEspecialidades as useEspecialidadesFromHooks } from './index';

// Verify types are exported
const _testOptions: UseEspecialidadesOptions = {
  search: 'test',
  enabled: true,
  staleTime: 60000,
};

// Type assertions to verify exports
const _testHook: typeof useEspecialidades = useEspecialidadesFromHooks;

// Prevent unused variable warnings
export { _testOptions, _testHook };
