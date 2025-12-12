/**
 * Test Script for Address Parser
 *
 * Run with: npx tsx src/lib/migrations/test-address-parser.ts
 */

// Mock the schema import for testing
const BRAZILIAN_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
] as const;

const BRAZIL_CENTER_LAT = -14.235;
const BRAZIL_CENTER_LNG = -51.9253;
const DEFAULT_STREET = 'Endereço não informado';
const DEFAULT_NUMBER = 'S/N';
const DEFAULT_NEIGHBORHOOD = 'Centro';
const DEFAULT_CITY = 'Não informado';
const DEFAULT_STATE = 'SP' as const;
const DEFAULT_POSTAL_CODE = '00000-000';
const DEFAULT_COUNTRY = 'Brasil';

interface ParsedAddress {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: typeof BRAZILIAN_STATES[number];
    postal_code: string;
    country: string;
    latitude: number;
    longitude: number;
}

function parseAddressText(addressText: string | null | undefined): ParsedAddress {
    const defaultAddress: ParsedAddress = {
        street: DEFAULT_STREET,
        number: DEFAULT_NUMBER,
        complement: '',
        neighborhood: DEFAULT_NEIGHBORHOOD,
        city: DEFAULT_CITY,
        state: DEFAULT_STATE,
        postal_code: DEFAULT_POSTAL_CODE,
        country: DEFAULT_COUNTRY,
        latitude: BRAZIL_CENTER_LAT,
        longitude: BRAZIL_CENTER_LNG,
    };

    if (!addressText || addressText.trim() === '') {
        return defaultAddress;
    }

    const text = addressText.trim();
    const result = { ...defaultAddress };

    // Try to extract CEP
    const cepMatch = text.match(/\b(\d{5})-?(\d{3})\b/);
    if (cepMatch) {
        result.postal_code = `${cepMatch[1]}-${cepMatch[2]}`;
    }

    // Try to extract state
    const stateMatch = text.match(/\b([A-Z]{2})\b/);
    if (stateMatch) {
        const stateCode = stateMatch[1] as any;
        if (BRAZILIAN_STATES.includes(stateCode)) {
            result.state = stateCode;
        }
    }

    // Try to extract city
    const cityMatch = text.match(/,\s*([^,\-]+?)\s*[-\/]\s*[A-Z]{2}/);
    if (cityMatch && cityMatch[1].trim().length > 0) {
        result.city = cityMatch[1].trim();
    } else {
        const cityFallback = text.match(/,\s*([^,]+?)\s*[A-Z]{2}/);
        if (cityFallback && cityFallback[1].trim().length > 0) {
            result.city = cityFallback[1].trim();
        }
    }

    // Try to extract street and number
    const streetMatch = text.match(/^([^,]+),\s*(\d+[\w]*)/);
    if (streetMatch) {
        result.street = streetMatch[1].trim();
        result.number = streetMatch[2].trim();
    } else {
        const firstPart = text.split(',')[0];
        if (firstPart && firstPart.trim().length > 0) {
            result.street = firstPart.trim();
        }
    }

    // Try to extract neighborhood
    const segments = text.split(',').map(s => s.trim());
    if (segments.length >= 3) {
        const neighborhoodCandidate = segments[2].replace(/[-\/]\s*[A-Z]{2}.*$/, '').trim();
        if (neighborhoodCandidate.length > 0 && neighborhoodCandidate.length < 100) {
            result.neighborhood = neighborhoodCandidate;
        }
    }

    // Try to extract complement
    const complementMatch = text.match(/,\s*\d+[\w]*\s*[-,]\s*([^,]+?)\s*,/);
    if (complementMatch && complementMatch[1].trim().length > 0) {
        const comp = complementMatch[1].trim();
        if (comp.length < 50 && !comp.match(/bairro|centro|jardim/i)) {
            result.complement = comp;
        }
    }

    return result;
}

// Test cases
const testCases = [
    {
        input: null,
        description: 'Null address'
    },
    {
        input: '',
        description: 'Empty address'
    },
    {
        input: 'Rua das Flores, 123, Centro, São Paulo - SP, 01234-567',
        description: 'Complete Brazilian address format'
    },
    {
        input: 'Av. Paulista, 1000, Bela Vista, São Paulo/SP',
        description: 'Address with / separator'
    },
    {
        input: 'Rua XV de Novembro, 456 - Apto 12, Jardim América, Curitiba - PR, 80000-000',
        description: 'Address with complement'
    },
    {
        input: 'Alameda Santos, 2000',
        description: 'Incomplete address (only street and number)'
    },
    {
        input: 'Hospital Central - Brasília',
        description: 'Simple text address'
    },
];

console.log('=== Address Parser Test Results ===\n');

testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.description}`);
    console.log(`Input: "${testCase.input}"`);
    const result = parseAddressText(testCase.input);
    console.log('Parsed result:');
    console.log(`  Street: ${result.street}`);
    console.log(`  Number: ${result.number}`);
    console.log(`  Complement: ${result.complement || '(empty)'}`);
    console.log(`  Neighborhood: ${result.neighborhood}`);
    console.log(`  City: ${result.city}`);
    console.log(`  State: ${result.state}`);
    console.log(`  Postal Code: ${result.postal_code}`);
    console.log(`  Coordinates: ${result.latitude}, ${result.longitude}`);
    console.log('---\n');
});

console.log('=== Test Complete ===');
