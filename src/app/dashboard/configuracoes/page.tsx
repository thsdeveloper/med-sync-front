import { Settings } from 'lucide-react';

import { PageHeader } from '@/components/organisms/page';
import { OrganizationBrandingSection } from '@/components/organisms/settings/OrganizationBrandingSection';
import { TeamPermissionsSection } from '@/components/organisms/settings/TeamPermissionsSection';
import { OperationsCommunicationSection } from '@/components/organisms/settings/OperationsCommunicationSection';
import { SecurityIntegrationsSection } from '@/components/organisms/settings/SecurityIntegrationsSection';

export default function SettingsPage() {
    return (
        <div className="flex flex-1 flex-col gap-8">
            <PageHeader
                eyebrow="Configurações"
                icon={<Settings className="h-6 w-6" />}
                title="Central de governança"
                description="Personalize identidade visual, permissões e integrações de segurança em um único lugar."
            />

            <div className="space-y-6">
                <OrganizationBrandingSection />
                <TeamPermissionsSection />
                <OperationsCommunicationSection />
                <SecurityIntegrationsSection />
            </div>
        </div>
    );
}


