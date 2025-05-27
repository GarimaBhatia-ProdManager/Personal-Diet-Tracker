import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@supabase/auth-helpers-react';

import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';

export function Header() {
  const pathname = usePathname();
  const user = useUser();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link href="/" passHref legacyBehavior>
                <NavigationMenuLink
                  className={`px-4 py-2 text-sm font-medium ${
                    isActive('/') ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  Dashboard
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link href="/meals" passHref legacyBehavior>
                <NavigationMenuLink
                  className={`px-4 py-2 text-sm font-medium ${
                    isActive('/meals') ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  Meals
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link href="/feedback" passHref legacyBehavior>
                <NavigationMenuLink
                  className={`px-4 py-2 text-sm font-medium ${
                    isActive('/feedback') ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  Feedback
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="ml-auto flex items-center space-x-4">
          {user ? (
            <Link href="/profile" passHref>
              <Button variant="ghost" size="sm">
                Profile
              </Button>
            </Link>
          ) : (
            <Link href="/auth" passHref>
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
} 