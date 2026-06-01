import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Camera, Mail, Key, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CountryPhoneInput from '@/components/common/CountryPhoneInput';

const ProfilePage = () => {
  const { t } = usePreferences();
  const { user, updateUserProfile } = useAppContext();
  const { isAdmin } = useUserRole();
  const location = useLocation();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  
  // Estados para validação
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [isValidatingPhone, setIsValidatingPhone] = useState(false);
  
  // For password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Verificar se é admin vindo da página admin
  const isAdminFromAdminPage = isAdmin && document.referrer.includes('/admin');

  
  // Fetch the latest user data from Supabase
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.id) {
          const { data, error } = await supabase
            .from('poupeja_users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (data && !error) {
            setName(data.name || '');
            setEmail(session.user.email || '');
            setPhone(data.phone || '');
            setProfileImage(data.profile_image || '');
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    
    fetchUserData();
  }, [user?.id]);

  // Função para validar email em tempo real
  const validateEmail = async (emailValue: string) => {
    if (!emailValue.trim()) {
      setEmailError(null);
      return;
    }

    // Se o email não mudou, não validar
    if (emailValue.trim() === user?.email) {
      setEmailError(null);
      return;
    }

    setIsValidatingEmail(true);
    setEmailError(null);

    try {
      const { data: validationData, error: validationError } = await supabase.functions.invoke('validate-profile-update', {
        body: {
          email: emailValue.trim(),
          phone: null, // Só validar email
          currentUserId: user?.id
        }
      });

      if (validationError) {
        console.error('Erro na validação de email:', validationError);
        setEmailError('Error de conexión. Intenta de nuevo.');
        return;
      }

      if (!validationData?.success) {
        const emailErrors = validationData?.errors?.filter((error: string) => 
          error.includes('email') || error.includes('Email')
        ) || [];
        
        if (emailErrors.length > 0) {
          setEmailError(emailErrors[0]);
        } else {
          setEmailError('Este correo ya está registrado en el sistema.');
        }
      } else {
        setEmailError(null);
      }
    } catch (error) {
      console.error('Erro na validação de email:', error);
      setEmailError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsValidatingEmail(false);
    }
  };

  // Função para validar telefone em tempo real
  const validatePhone = async (phoneValue: string) => {
    const formattedPhone = phoneValue.replace(/\D/g, '');
    
    if (!formattedPhone) {
      setPhoneError(null);
      return;
    }

    // Se o telefone não mudou, não validar
    if (formattedPhone === user?.phone) {
      setPhoneError(null);
      return;
    }

    setIsValidatingPhone(true);
    setPhoneError(null);

    try {
      const { data: validationData, error: validationError } = await supabase.functions.invoke('validate-profile-update', {
        body: {
          email: null, // Só validar telefone
          phone: formattedPhone,
          currentUserId: user?.id
        }
      });

      if (validationError) {
        console.error('Erro na validação de telefone:', validationError);
        setPhoneError('Error de conexión. Intenta de nuevo.');
        return;
      }

      if (!validationData?.success) {
        const phoneErrors = validationData?.errors?.filter((error: string) => 
          error.includes('WhatsApp') || error.includes('telefone') || error.includes('número')
        ) || [];
        
        if (phoneErrors.length > 0) {
          setPhoneError(phoneErrors[0]);
        } else {
          setPhoneError('Este WhatsApp ya está registrado en el sistema.');
        }
      } else {
        setPhoneError(null);
      }
    } catch (error) {
      console.error('Erro na validação de telefone:', error);
      setPhoneError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsValidatingPhone(false);
    }
  };

  // Handlers para onBlur
  const handleEmailBlur = () => {
    if (email.trim()) {
      validateEmail(email);
    }
  };

  const handlePhoneBlur = () => {
    if (phone.trim()) {
      validatePhone(phone);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUpdatingProfile(true);
    
    // Verificar se há erros de validação em tempo real
    if (emailError || phoneError) {
      toast({
        title: t('common.error'),
        description: 'Por favor corrige los errores en los campos antes de continuar.',
        variant: 'destructive',
      });
      setUpdatingProfile(false);
      return;
    }
    
    try {
      console.log('ProfilePage: Updating profile...');
      
      // Format phone number to ensure it only contains digits
      const formattedPhone = phone.replace(/\D/g, '');
      
      // Check if email or phone changed
      const emailChanged = email !== user?.email;
      const phoneChanged = formattedPhone !== user?.phone;
      
      // Validar dados antes de salvar se mudaram
      if (emailChanged || phoneChanged) {
        console.log('ProfilePage: Validating changed data...');
        
        const { data: validationData, error: validationError } = await supabase.functions.invoke('validate-profile-update', {
          body: {
            email: emailChanged ? email.trim() : null,
            phone: phoneChanged ? formattedPhone : null,
            currentUserId: user?.id
          }
        });

        if (validationError) {
          console.error('ProfilePage: Error validating data:', validationError);
          toast({
            title: t('common.error'),
            description: 'Error de conexión. Intenta de nuevo.',
            variant: 'destructive',
          });
          setUpdatingProfile(false);
          return;
        }

        if (!validationData?.success) {
          const errors = validationData?.errors || [];
          console.log('ProfilePage: Validation failed:', errors);
          
          // Mostrar primeiro erro encontrado
          const firstError = errors[0] || 'Dados já estão em uso por outro usuário';
          toast({
            title: t('common.error'),
            description: firstError,
            variant: 'destructive',
          });
          setUpdatingProfile(false);
          return;
        }
        
        console.log('ProfilePage: Validation passed');
      }
      
      // Update profile data using context method
      console.log('ProfilePage: Updating profile data:', { name, phone: formattedPhone, profileImage });
      await updateUserProfile({ 
        name,
        phone: formattedPhone,
        profileImage
      });
      
      // Update email if changed
      if (emailChanged) {
        console.log('ProfilePage: Updating user email');
        
        const { error: updateEmailError } = await supabase.functions.invoke('update-user-email', {
          body: { email }
        });
        
        if (updateEmailError) {
          console.error('ProfilePage: Error updating email:', updateEmailError);
          toast({
            title: t('common.error'),
            description: 'Error al actualizar correo electrónico',
            variant: 'destructive',
          });
          return;
        }
      }
      
      // Show success message
      toast({
        title: t('common.success'),
                    description: 'Perfil actualizado con éxito',
      });
      
      setIsEditing(false);
      console.log('ProfilePage: Profile update completed successfully');
      
    } catch (error) {
      console.error("ProfilePage: Error updating profile:", error);
      toast({
        title: t('common.error'),
                    description: 'Error al actualizar perfil',
        variant: 'destructive',
      });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: t('common.error'),
                    description: 'Las contraseñas no coinciden',
        variant: 'destructive',
      });
      return;
    }
    
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast({
        title: t('common.success'),
                    description: 'Contraseña cambiada con éxito',
      });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: t('common.error'),
                    description: 'Error al cambiar contraseña',
        variant: 'destructive',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Upload image to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(`public/${fileName}`, file);

      if (error) {
        throw error;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(`public/${fileName}`);

      setProfileImage(urlData.publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: t('common.error'),
                    description: 'Error al subir la imagen',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };
  
  if (isAdminFromAdminPage) {
    return (
      <MainLayout title="Perfil del Administrador">
        <div className="space-y-6 pb-16">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Perfil del Administrador</h1>
            <p className="text-muted-foreground">Gestiona tus información de acceso</p>
          </div>
          
          <Separator />
          
          <div className="grid gap-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
                                  <CardDescription>Tus datos de acceso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="h-16 w-16">
                    {uploading ? (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <>
                        <AvatarImage src={profileImage} />
                        <AvatarFallback className="text-lg">{name?.charAt(0) || email?.charAt(0)}</AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-medium">{user?.name || 'Administrador'}</h3>
                    <p className="text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                                          <div className="grid gap-2">
                        <label htmlFor="name" className="font-medium">Nombre</label>
                        <Input 
                          id="name" 
                          value={name} 
                          onChange={(e) => setName(e.target.value)} 
                          placeholder="Tu nombre completo" 
                        />
                      </div>
                    
                                          <div className="grid gap-2">
                        <label htmlFor="email" className="font-medium">Correo Electrónico</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input 
                            id="email" 
                            type="email"
                            value={email} 
                            onChange={(e) => {
                              setEmail(e.target.value);
                              // Limpar erro quando usuário começar a digitar
                              if (emailError) {
                                setEmailError(null);
                              }
                            }}
                            onBlur={handleEmailBlur}
                            placeholder="tu@email.com" 
                            className={`pl-10 ${emailError ? 'border-red-500 focus:border-red-500' : ''}`}
                          />
                        </div>
                        {isValidatingEmail && (
                          <p className="text-sm text-blue-600">Validando email...</p>
                        )}
                        {emailError && (
                          <p className="text-sm text-red-600">{emailError}</p>
                        )}
                      </div>
                    
                    <div className="flex space-x-2">
                      <Button type="submit" disabled={updatingProfile}>
                        {updatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('common.save')}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>Editar Informaciones</Button>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                                  <CardTitle>Cambiar Contraseña</CardTitle>
                <CardDescription>Atualize sua senha de acesso</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="grid gap-2">
                    <label htmlFor="newPassword" className="font-medium">Nueva Contraseña</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input 
                        id="newPassword" 
                        type="password"
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        placeholder="••••••••"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <label htmlFor="confirmPassword" className="font-medium">Confirmar Contraseña</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input 
                        id="confirmPassword" 
                        type="password"
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        placeholder="••••••••"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={changingPassword}>
                    {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Alterar Senha
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title={t('profile.title')}>
      <div className="space-y-6 pb-16">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('profile.title')}</h1>
          <p className="text-muted-foreground">Gestiona tus datos personales</p>
        </div>
        
        <Separator />
        
        <div className="grid gap-6">
          <Tabs defaultValue="info">
            <TabsList>
              <TabsTrigger value="info">Información Personal</TabsTrigger>
              <TabsTrigger value="password">Contraseña</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>Información Personal</CardTitle>
                                      <CardDescription>Tus datos de registro y contacto</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <Avatar className="h-20 w-20">
                        {uploading ? (
                          <div className="flex h-full w-full items-center justify-center bg-muted">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <>
                            <AvatarImage src={profileImage} />
                            <AvatarFallback className="text-xl">{name?.charAt(0) || email?.charAt(0)}</AvatarFallback>
                          </>
                        )}
                      </Avatar>
                      {isEditing && (
                        <div 
                          className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer shadow-md"
                          onClick={handleImageClick}
                        >
                          <Camera className="h-4 w-4" />
                          <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleImageChange}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">{user?.name || 'Usuario'}</h3>
                      <p className="text-muted-foreground">{user?.email}</p>
                      {user?.phone && <p className="text-muted-foreground">{user.phone}</p>}
                    </div>
                  </div>
                  
                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid gap-2">
                        <label htmlFor="name" className="font-medium">Nome</label>
                        <Input 
                          id="name" 
                          value={name} 
                          onChange={(e) => setName(e.target.value)} 
                          placeholder="Seu nome completo" 
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <label htmlFor="email" className="font-medium">E-mail</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input 
                            id="email" 
                            type="email"
                            value={email} 
                            onChange={(e) => {
                              setEmail(e.target.value);
                              // Limpar erro quando usuário começar a digitar
                              if (emailError) {
                                setEmailError(null);
                              }
                            }}
                            onBlur={handleEmailBlur}
                            placeholder="seu@email.com" 
                            className={`pl-10 ${emailError ? 'border-red-500 focus:border-red-500' : ''}`}
                          />
                        </div>
                        {isValidatingEmail && (
                          <p className="text-sm text-blue-600">Validando email...</p>
                        )}
                        {emailError && (
                          <p className="text-sm text-red-600">{emailError}</p>
                        )}
                      </div>
                      
                      <div className="grid gap-2">
                        <label htmlFor="phone" className="font-medium">WhatsApp</label>
                        <CountryPhoneInput
                          value={phone}
                          onChange={(value) => {
                            setPhone(value);
                            // Limpar erro quando usuário começar a digitar
                            if (phoneError) {
                              setPhoneError(null);
                            }
                          }}
                          onBlur={handlePhoneBlur}
                          placeholder="(DDD) número — ej.: 11 99999-9999"
                          error={phoneError}
                        />
                        {isValidatingPhone && (
                          <p className="text-sm text-blue-600">Validando WhatsApp...</p>
                        )}
                        {phoneError && (
                          <p className="text-sm text-red-600">{phoneError}</p>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button type="submit" disabled={updatingProfile}>
                          {updatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {t('common.save')}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                          {t('common.cancel')}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <Button onClick={() => setIsEditing(true)}>Editar Perfil</Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle>Cambiar Contraseña</CardTitle>
                  <CardDescription>Atualize sua senha de acesso</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="grid gap-2">
                      <label htmlFor="newPassword" className="font-medium">Nova Senha</label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input 
                          id="newPassword" 
                          type="password"
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)} 
                          placeholder="••••••••"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <label htmlFor="confirmPassword" className="font-medium">Confirmar Senha</label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input 
                          id="confirmPassword" 
                          type="password"
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)} 
                          placeholder="••••••••"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <Button type="submit" disabled={changingPassword}>
                      {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Alterar Senha
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
