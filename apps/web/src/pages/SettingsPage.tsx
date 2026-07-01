import { useAuthStore } from '../stores/auth-store';
import {
  User,
  Mail,
  Shield,
  Palette,
  Bell,
  Key,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();

  const sections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Profile', description: 'Manage your personal information', value: user?.name },
        { icon: Mail, label: 'Email', description: 'Your email address', value: user?.email },
        { icon: Key, label: 'Password', description: 'Update your password', value: null },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: Palette, label: 'Appearance', description: 'Customize the look and feel', value: 'System default' },
        { icon: Bell, label: 'Notifications', description: 'Manage notification settings', value: 'Enabled' },
        { icon: Shield, label: 'Privacy', description: 'Control your data and privacy', value: null },
      ],
    },
  ];

  return (
    <div className="p-8 max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h2>
        <p className="text-gray-500 mt-1">Manage your account preferences</p>
      </div>

      {/* Profile card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-6 mb-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-md">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{user?.name}</h3>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          <div className="ml-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-medium">
              <Sparkles className="w-3 h-3" />
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Settings sections */}
      {sections.map((section) => (
        <div key={section.title} className="mb-8">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
            {section.title}
          </h3>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/60 divide-y divide-gray-100 overflow-hidden shadow-sm">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <Icon className="w-5 h-5 text-gray-500 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                  </div>
                  {item.value && (
                    <span className="text-sm text-gray-500 mr-2 truncate">{item.value}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* App version */}
      <div className="text-center text-xs text-gray-400 mt-12">
        <p>DocMind AI v1.0.0</p>
        <p className="mt-1">Built with ❤️ using React + NestJS + pgvector</p>
      </div>
    </div>
  );
}
