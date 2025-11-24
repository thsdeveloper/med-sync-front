import { OrganizationBrandingSection } from '@/components/organisms/settings/OrganizationBrandingSection';
import { TeamPermissionsSection } from '@/components/organisms/settings/TeamPermissionsSection';
import { OperationsCommunicationSection } from '@/components/organisms/settings/OperationsCommunicationSection';
import { SecurityIntegrationsSection } from '@/components/organisms/settings/SecurityIntegrationsSection';

export default function SettingsPage() {
    return (
        <div className="flex flex-col gap-8 py-6">
            <header className="space-y-2">
                <p className="text-sm font-semibold text-blue-600">Configurações</p>
                <h1 className="text-3xl font-bold tracking-tight">Central de governança</h1>
                <p className="text-muted-foreground">
                    Personalize a identidade da organização, controle acessos, fluxos de comunicação e camadas de
                    segurança em um único lugar.
                </p>
            </header>

            <div className="space-y-6">
                <OrganizationBrandingSection />
                <TeamPermissionsSection />
                <OperationsCommunicationSection />
                <SecurityIntegrationsSection />
            </div>
        </div>
    );
}


