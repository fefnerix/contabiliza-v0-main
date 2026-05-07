import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Check, ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAdminContent } from "@/hooks/useAdminContent";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const typeBadge: Record<string, string> = {
  info: "bg-blue-500/20 text-blue-300",
  warning: "bg-amber-500/20 text-amber-300",
  critical: "bg-red-500/20 text-red-300",
  success: "bg-emerald-500/20 text-emerald-300",
};

const AdminContentPage = () => {
  const { toast } = useToast();
  const {
    pages,
    announcements,
    defaultCategories,
    globalAnnouncement,
    savePage,
    publishPage,
    unpublishPage,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    toggleAnnouncement,
    updateGlobalAnnouncement,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useAdminContent();
  const [pageSheetOpen, setPageSheetOpen] = useState(false);
  const [pageForm, setPageForm] = useState({ title: "", slug: "", body: "", is_published: false });
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [deleteAnnouncementId, setDeleteAnnouncementId] = useState<string | null>(null);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({
    message: "",
    type: "info",
    audience: "all",
    valid_from: undefined as Date | undefined,
    valid_until: undefined as Date | undefined,
    is_active: true,
  });
  const [globalForm, setGlobalForm] = useState(globalAnnouncement);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", type: "expense", is_default: true });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState({ name: "", type: "expense", is_default: true });

  useEffect(() => {
    setGlobalForm(globalAnnouncement);
  }, [globalAnnouncement]);

  const openPageEditor = (page?: any) => {
    if (page) {
      setPageForm({
        title: page.title ?? "",
        slug: page.slug ?? "",
        body: page.body ?? "",
        is_published: !!page.is_published,
      });
    } else {
      setPageForm({ title: "", slug: "", body: "", is_published: false });
    }
    setPageSheetOpen(true);
  };

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold">Conteúdo editorial</h2>
      <Tabs defaultValue="pages">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="pages">PÁGINAS</TabsTrigger>
          <TabsTrigger value="announcements">ANÚNCIOS</TabsTrigger>
          <TabsTrigger value="categories">CATEGORIAS PADRÃO</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => openPageEditor()}><Plus className="h-4 w-4 mr-2" />Nova página</Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {pages.map((page) => (
              <Card key={page.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{page.title}</span>
                    <Badge className={page.is_published ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-500/20 text-zinc-300"}>
                      {page.is_published ? "Publicado ✅" : "Rascunho 📝"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="font-mono text-xs text-zinc-400">{page.slug}</p>
                  <p className="text-sm text-zinc-400">Atualizado em {new Date(page.updated_at).toLocaleString("pt-BR")}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openPageEditor(page)}><Pencil className="h-4 w-4 mr-1" />Editar</Button>
                    <Button
                      size="sm"
                      onClick={() => (page.is_published ? unpublishPage(page.slug) : publishPage(page.slug))}
                      variant={page.is_published ? "secondary" : "default"}
                    >
                      {page.is_published ? "Despublicar" : "Publicar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Anúncio global instantâneo</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={globalForm.message}
                onChange={(e) => setGlobalForm((g) => ({ ...g, message: e.target.value }))}
                placeholder="Mensagem global para todos os usuários"
              />
              <div className="grid grid-cols-2 gap-2">
                <Select value={globalForm.type} onValueChange={(value) => setGlobalForm((g) => ({ ...g, type: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">info</SelectItem>
                    <SelectItem value="warning">aviso</SelectItem>
                    <SelectItem value="critical">crítico</SelectItem>
                    <SelectItem value="success">sucesso</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center justify-between rounded-md border px-3">
                  <span className="text-sm">Ativo</span>
                  <Switch checked={globalForm.enabled} onCheckedChange={(v) => setGlobalForm((g) => ({ ...g, enabled: v }))} />
                </div>
              </div>
              <p className="text-sm text-zinc-400">Aparece para TODOS os usuários imediatamente.</p>
              <Button onClick={() => updateGlobalAnnouncement(globalForm)}>Salvar anúncio global</Button>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditingAnnouncementId(null);
                setAnnouncementForm({
                  message: "",
                  type: "info",
                  audience: "all",
                  valid_from: undefined,
                  valid_until: undefined,
                  is_active: true,
                });
                setAnnouncementOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo anúncio
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mensagem</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Para</TableHead>
                    <TableHead>Válido até</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.message.length > 70 ? `${item.message.slice(0, 70)}...` : item.message}</TableCell>
                      <TableCell><Badge className={typeBadge[item.type]}>{item.type}</Badge></TableCell>
                      <TableCell>{item.audience}</TableCell>
                      <TableCell>{item.valid_until ? new Date(item.valid_until).toLocaleDateString("pt-BR") : "—"}</TableCell>
                      <TableCell>{item.is_active ? "Ativo" : "Inativo"}</TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline" onClick={() => toggleAnnouncement(item.id)}>{item.is_active ? "Desativar" : "Ativar"}</Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingAnnouncementId(item.id);
                            setAnnouncementForm({
                              message: item.message,
                              type: item.type,
                              audience: item.audience,
                              valid_from: item.valid_from ? new Date(item.valid_from) : undefined,
                              valid_until: item.valid_until ? new Date(item.valid_until) : undefined,
                              is_active: item.is_active,
                            });
                            setAnnouncementOpen(true);
                          }}
                        >
                          ✏️
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteAnnouncementId(item.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setCategoryOpen(true)}><Plus className="h-4 w-4 mr-2" />Nova categoria</Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Padrão</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {defaultCategories.map((cat) => {
                    const editing = editingCategoryId === cat.id;
                    return (
                      <TableRow key={cat.id}>
                        <TableCell>
                          {editing ? (
                            <Input value={editingCategory.name} onChange={(e) => setEditingCategory((v) => ({ ...v, name: e.target.value }))} />
                          ) : (
                            cat.name
                          )}
                        </TableCell>
                        <TableCell>
                          {editing ? (
                            <Select value={editingCategory.type} onValueChange={(v) => setEditingCategory((s) => ({ ...s, type: v as "income" | "expense" }))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="income">Receita</SelectItem>
                                <SelectItem value="expense">Despesa</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="secondary">{cat.type === "income" ? "Receita" : "Despesa"}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {editing ? (
                            <Switch checked={editingCategory.is_default} onCheckedChange={(v) => setEditingCategory((s) => ({ ...s, is_default: v }))} />
                          ) : (
                            cat.is_default ? "Sim" : "Não"
                          )}
                        </TableCell>
                        <TableCell className="space-x-2">
                          {editing ? (
                            <>
                              <Button
                                size="sm"
                                onClick={async () => {
                                  await updateCategory(cat.id, editingCategory);
                                  setEditingCategoryId(null);
                                  toast({ title: "Categoria atualizada" });
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingCategoryId(null)}>×</Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingCategoryId(cat.id);
                                  setEditingCategory({ name: cat.name, type: cat.type, is_default: cat.is_default });
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => setDeleteCategoryId(cat.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={pageSheetOpen} onOpenChange={setPageSheetOpen}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader><SheetTitle>Editor de página</SheetTitle></SheetHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Título</Label>
              <Input
                value={pageForm.title}
                onChange={(e) => setPageForm((p) => ({ ...p, title: e.target.value, slug: slugify(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={pageForm.slug}
                onChange={(e) => setPageForm((p) => ({ ...p, slug: slugify(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Corpo</Label>
              <Textarea rows={14} value={pageForm.body} onChange={(e) => setPageForm((p) => ({ ...p, body: e.target.value }))} />
            </div>
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-zinc-300">
                <ChevronDown className="h-4 w-4" /> Preview markdown
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 rounded-md border p-3 prose prose-invert max-w-none">
                  <ReactMarkdown>{pageForm.body || "_Sem conteúdo_"}</ReactMarkdown>
                </div>
              </CollapsibleContent>
            </Collapsible>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={async () => {
                  await savePage(pageForm.slug, { title: pageForm.title, body: pageForm.body, is_published: false });
                  setPageSheetOpen(false);
                  toast({ title: "Rascunho salvo" });
                }}
              >
                Salvar rascunho
              </Button>
              <Button
                onClick={async () => {
                  await savePage(pageForm.slug, { title: pageForm.title, body: pageForm.body, is_published: true });
                  setPageSheetOpen(false);
                  toast({ title: "Página publicada" });
                }}
              >
                Publicar agora
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingAnnouncementId ? "Editar anúncio" : "Novo anúncio"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Mensagem ({announcementForm.message.length}/200)</Label>
            <Input
              maxLength={200}
              value={announcementForm.message}
              onChange={(e) => setAnnouncementForm((f) => ({ ...f, message: e.target.value }))}
            />
            <Label>Tipo</Label>
            <Select value={announcementForm.type} onValueChange={(value) => setAnnouncementForm((f) => ({ ...f, type: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="info">info</SelectItem>
                <SelectItem value="warning">aviso</SelectItem>
                <SelectItem value="critical">crítico</SelectItem>
                <SelectItem value="success">sucesso</SelectItem>
              </SelectContent>
            </Select>
            <div className={`rounded-md px-3 py-2 text-sm ${typeBadge[announcementForm.type]}`}>Preview: {announcementForm.message || "Mensagem do banner"}</div>
            <Label>Aparece para</Label>
            <RadioGroup value={announcementForm.audience} onValueChange={(value) => setAnnouncementForm((f) => ({ ...f, audience: value }))}>
              {[
                { value: "all", label: "Todos" },
                { value: "active", label: "Ativos" },
                { value: "expiring", label: "Expirando" },
                { value: "trial", label: "Trial" },
                { value: "expired", label: "Expirados" },
              ].map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <RadioGroupItem value={opt.value} id={`aud-${opt.value}`} />
                  <Label htmlFor={`aud-${opt.value}`}>{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Válido de</Label>
                <DatePicker date={announcementForm.valid_from} setDate={(date) => setAnnouncementForm((f) => ({ ...f, valid_from: date }))} />
              </div>
              <div>
                <Label>Até (opcional)</Label>
                <DatePicker date={announcementForm.valid_until} setDate={(date) => setAnnouncementForm((f) => ({ ...f, valid_until: date }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAnnouncementOpen(false)}>Cancelar</Button>
              <Button
                onClick={async () => {
                  const payload = {
                    message: announcementForm.message,
                    type: announcementForm.type as any,
                    audience: announcementForm.audience as any,
                    valid_from: announcementForm.valid_from ? announcementForm.valid_from.toISOString() : null,
                    valid_until: announcementForm.valid_until ? announcementForm.valid_until.toISOString() : null,
                    is_active: announcementForm.is_active,
                  };
                  if (editingAnnouncementId) await updateAnnouncement(editingAnnouncementId, payload);
                  else await createAnnouncement(payload);
                  setAnnouncementOpen(false);
                  setEditingAnnouncementId(null);
                  toast({ title: editingAnnouncementId ? "Anúncio atualizado" : "Anúncio criado" });
                }}
              >
                Salvar anúncio
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova categoria</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Nome</Label>
            <Input value={categoryForm.name} onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value }))} />
            <Label>Tipo</Label>
            <Select value={categoryForm.type} onValueChange={(value) => setCategoryForm((f) => ({ ...f, type: value as "income" | "expense" }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Receita</SelectItem>
                <SelectItem value="expense">Despesa</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center justify-between">
              <Label>Padrão para novos usuários</Label>
              <Switch checked={categoryForm.is_default} onCheckedChange={(v) => setCategoryForm((f) => ({ ...f, is_default: v }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCategoryOpen(false)}>Cancelar</Button>
              <Button
                onClick={async () => {
                  await createCategory(categoryForm as any);
                  setCategoryOpen(false);
                  setCategoryForm({ name: "", type: "expense", is_default: true });
                }}
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteAnnouncementId} onOpenChange={(v) => !v && setDeleteAnnouncementId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover anúncio?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteAnnouncementId) return;
                await deleteAnnouncement(deleteAnnouncementId);
                setDeleteAnnouncementId(null);
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteCategoryId} onOpenChange={(v) => !v && setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar categoria?</AlertDialogTitle>
            <AlertDialogDescription>Usuários que usam esta categoria perderão o vínculo. Continuar?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteCategoryId) return;
                await deleteCategory(deleteCategoryId);
                setDeleteCategoryId(null);
              }}
            >
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminContentPage;

