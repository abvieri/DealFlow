import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Loader2, Database } from "lucide-react";
import { toast } from "sonner";

export default function MigrateData() {
  interface MigrationStats {
    success: number;
    errors: number;
  }

  interface MigrationResults {
    [key: string]: MigrationStats;
  }

  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<MigrationResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMigration = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('migrate-data');

      if (error) {
        throw error;
      }

      if (data.success) {
        setResults(data.results);
        toast.success(data.message);
      } else {
        throw new Error(data.error || 'Erro desconhecido na migração');
      }
    } catch (err: any) {
      console.error('Erro na migração:', err);
      setError(err.message || 'Erro ao executar migração');
      toast.error('Erro ao executar migração');
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalSuccess = (): number => {
    if (!results) return 0;
    return Object.values(results).reduce((acc, curr) => acc + curr.success, 0);
  };

  const getTotalErrors = (): number => {
    if (!results) return 0;
    return Object.values(results).reduce((acc, curr) => acc + curr.errors, 0);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            <CardTitle>Migração de Dados</CardTitle>
          </div>
          <CardDescription>
            Migrar dados do banco externo para o banco atual do Lovable Cloud
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {results && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  Migração concluída! {getTotalSuccess()} registros migrados com sucesso
                  {getTotalErrors() > 0 && `, ${getTotalErrors()} erros`}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                {Object.entries(results).map(([table, stats]) => (
                  <div key={table} className="p-3 bg-muted rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium capitalize">{table.replace('_', ' ')}</span>
                      <span className="text-sm text-muted-foreground">
                        {stats.success} sucesso / {stats.errors} erros
                      </span>
                    </div>
                    <Progress 
                      value={stats.success > 0 ? 100 : 0} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4">
            <Button
              onClick={handleMigration}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Migrando dados...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Iniciar Migração
                </>
              )}
            </Button>
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              <strong>Atenção:</strong> Esta operação irá copiar todos os dados do banco externo
              para o banco atual. Registros com IDs duplicados serão atualizados.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
