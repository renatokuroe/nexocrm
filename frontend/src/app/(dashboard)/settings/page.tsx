import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

// Settings page placeholder for future tenant-level preferences.
export default function SettingsPage() {
    return (
        <section>
            <PageHeader
                title="Configurações"
                subtitle="Gerencie parâmetros globais da sua operação."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Preferências Gerais</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-slate-500">
                        Esta área está pronta para evolução com temas, regras de automação e integrações.
                    </p>
                </CardContent>
            </Card>
        </section>
    );
}
