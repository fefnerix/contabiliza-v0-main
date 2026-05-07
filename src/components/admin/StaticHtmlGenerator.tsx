import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface GenerationResult {
  success: boolean
  data?: {
    company_name: string
    company_description: string
    company_logo: string
    html_content: string
    instructions: {
      step1: string
      step2: string
      step3: string
      step4: string
    }
  }
  error?: string
}

export const StaticHtmlGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [githubPath, setGithubPath] = useState('')
  const { toast } = useToast()

  const generateStaticHtml = async () => {
    setIsGenerating(true)
    setResult(null)
    setCopied(false)

    try {
      console.log('[STATIC-HTML] Chamando função generate-html...')

      // Importando a constante SUPABASE_URL
      const { SUPABASE_URL } = await import('@/integrations/supabase/client')
      
      // Chamar a Edge Function (sem autenticação)
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/generate-html`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || `Error HTTP: ${response.status}`)
      }

      setResult(data)
      
      if (data.success) {
        console.log('[STATIC-HTML] HTML gerado com sucesso para:', data.data.company_name)
      }

    } catch (error) {
      console.error('[STATIC-HTML] Erro:', error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async () => {
    if (result?.data?.html_content) {
      try {
        await navigator.clipboard.writeText(result.data.html_content)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast({
          title: "HTML copiado!",
          description: "O conteúdo foi copiado para a área de transferência.",
          variant: "default"
        })
      } catch (err) {
        console.error('Erro ao copiar:', err)
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar para a área de transferência.",
          variant: "destructive"
        })
      }
    }
  }

  const openGitHubFile = () => {
    if (!githubPath) {
      toast({
        title: "Configuração necessária",
        description: "Preencha o caminho do GitHub primeiro (ex: seu-usuario/seu-repositorio).",
        variant: "destructive"
      })
      return
    }

    // Abrir GitHub diretamente no arquivo index.html
    const githubUrl = `https://github.com/${githubPath}/edit/main/index.html`
    window.open(githubUrl, '_blank')
    
    toast({
      title: "GitHub aberto!",
      description: `Navegando para edição do index.html em ${githubPath}`,
      variant: "default"
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📄 Generador de HTML Estático
        </CardTitle>
        <CardDescription>
          Genera un archivo index.html optimizado con tus meta tags dinámicos.
          Ideal para WhatsApp y redes sociales con UTF-8 corregido.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Botão de Geração */}
        <Button 
          onClick={generateStaticHtml}
          disabled={isGenerating}
          className="flex items-center gap-2"
          size="lg"
        >
          {isGenerating ? '⏳ Generando HTML...' : '🚀 Generar HTML Optimizado'}
        </Button>

        {/* Resultado */}
        {result && (
          <div className="space-y-4">
            {result.success ? (
              <Alert className="border-gray-600 bg-gray-900 text-gray-100">
                <div className="space-y-4">
                  <AlertDescription className="font-medium">
                    ✅ HTML generado con éxito!
                  </AlertDescription>
                  
                  {result.data && (
                    <div className="space-y-4">
                      {/* Informações da Empresa */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Nombre:</span> {result.data.company_name}
                        </div>
                        <div>
                          <span className="font-medium">Descripción:</span> {result.data.company_description}
                        </div>
                      </div>
                      
                      {/* Instruções Passo a Passo */}
                      <div className="bg-gray-800 p-4 rounded-lg text-gray-100">
                        <h4 className="font-medium mb-2">📋 Cómo aplicar:</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm">
                          <li>{result.data.instructions.step1}</li>
                          <li>{result.data.instructions.step2}</li>
                          <li>{result.data.instructions.step3}</li>
                          <li>{result.data.instructions.step4}</li>
                        </ol>
                      </div>
                      
                      {/* Botão Copiar HTML */}
                      <div className="flex justify-center">
                        <Button 
                          onClick={copyToClipboard}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          {copied ? '✅ ¡Copiado!' : '📋 Copiar HTML'}
                        </Button>
                      </div>
                      
                      {/* HTML Code Preview */}
                      <details className="text-sm">
                        <summary className="font-medium cursor-pointer hover:text-blue-400 p-2 bg-gray-800 rounded text-gray-100">
                          👁️ Ver HTML Completo (haz clic para expandir)
                        </summary>
                        <div className="mt-2 relative">
                          <pre className="p-4 bg-gray-900 text-green-400 rounded text-xs overflow-x-auto max-h-96 border">
                            <code>{result.data.html_content}</code>
                          </pre>
                          <Button
                            onClick={copyToClipboard}
                            size="sm"
                            variant="secondary"
                            className="absolute top-2 right-2 text-xs"
                          >
                            {copied ? '✅' : '📋'}
                          </Button>
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </Alert>
            ) : (
              <Alert className="border-red-700 bg-red-900 text-red-100">
                <AlertDescription>
                  ❌ Error: {result.error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Informações sobre o processo */}
        <div className="text-sm text-gray-300 space-y-2 p-4 bg-gray-800 rounded-lg">
          <h4 className="font-medium text-gray-100">ℹ️ Información importante:</h4>
          <ul className="space-y-1 list-disc list-inside">
            <li><strong>UTF-8 corregido:</strong> Caracteres como "ción" y "já" serán mostrados correctamente</li>
            <li><strong>WhatsApp optimizado:</strong> Meta tags específicos para redes sociales</li>
            <li><strong>SEO-friendly:</strong> Title y description dinámicos</li>
            <li><strong>Deploy automático:</strong> Vercel/Easypanel detecta cambios automáticamente</li>
          </ul>
          
          <div className="mt-3 pt-2 border-t border-gray-600">
            <span className="font-medium text-gray-100">💡 Consejo:</span> Ejecuta siempre que cambies el nombre o descripción de la empresa.
          </div>
        </div>

        {/* Configuração do GitHub */}
        <div className="border rounded-lg p-4 space-y-4 bg-gray-900 text-gray-100">
          <h4 className="font-medium">Configuração do GitHub</h4>
          <div className="space-y-2">
            <Label htmlFor="github-path" className="text-gray-200">Caminho do GitHub</Label>
            <Input
              id="github-path"
              placeholder="ex: seu-usuario/seu-repositorio"
              value={githubPath}
              onChange={(e) => setGithubPath(e.target.value)}
              className="bg-gray-800 border-gray-700 text-gray-100"
            />
            <p className="text-xs text-gray-400">
              Digite o usuário e repositório no formato: USUARIO/REPOSITORIO
            </p>
          </div>
          <div className="flex justify-center">
            <Button
              onClick={openGitHubFile}
              variant="secondary"
              disabled={!githubPath}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir GitHub - Editar index.html
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 