# 🚀 Deployment Guide for TradeToys.ca

## Deployment Options

### Option 1: Vercel (Recommended for Next.js) ⚡

Vercel is the easiest way to deploy Next.js applications.

#### Steps:

1. **Already on GitHub!**
   
   Your repository is at: https://github.com/ItzXizZ/tradetoys.git
   
   To push future changes:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Set Environment Variables**
   - In Vercel project settings, go to "Environment Variables"
   - Add:
     NEXT_PUBLIC_SUPABASE_URL=https://jjxwridpyplxqlefibni.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqeHdyaWRweXBseHFsZWZpYm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NTU3MDMsImV4cCI6MjA3ODEzMTcwM30.Co6qA8Yw_yDoVQtn6ywwItl4qzEh6PKuPjkFbKq8nmI

4. **Deploy**
   - Click "Deploy"
   - Your app will be live at `your-project.vercel.app`

5. **Custom Domain** (Optional)
   - Go to Project Settings > Domains
   - Add `tradetoys.ca`
   - Follow DNS configuration instructions

### Option 2: Netlify 🦸

1. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`

2. **Environment Variables**
   - Add the same Supabase variables as above

3. **Deploy**
   - Connect your Git repository
   - Netlify will auto-deploy on every push

### Option 3: Self-Hosted (VPS/Dedicated Server) 🖥️

For Ubuntu/Debian servers:

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone your repository
git clone YOUR_REPO_URL
cd toytrade

# Install dependencies
npm install

# Create .env.local file
nano .env.local
# (paste your environment variables)

# Build the application
npm run build

# Install PM2 for process management
sudo npm install -g pm2

# Start the application
pm2 start npm --name "tradetoys" -- start

# Make PM2 start on boot
pm2 startup
pm2 save

# Set up Nginx as reverse proxy
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/tradetoys
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name tradetoys.ca www.tradetoys.ca;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/tradetoys /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Set up SSL with Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d tradetoys.ca -d www.tradetoys.ca
```

## Pre-Deployment Checklist ✅

### Security
- [ ] Change default admin password
- [ ] Review Supabase RLS policies
- [ ] Set up Supabase row-level security rules
- [ ] Enable Supabase Auth email confirmations
- [ ] Set up proper CORS policies
- [ ] Review storage bucket policies

### Supabase Configuration
- [ ] Database schema deployed
- [ ] Storage bucket created and configured
- [ ] Storage policies set up
- [ ] Test admin account created
- [ ] RLS policies enabled on all tables
- [ ] Database functions tested

### Application
- [ ] Test all three user roles (admin, donator, receiver)
- [ ] Test image upload functionality
- [ ] Test toy claiming/unclaiming
- [ ] Verify point system works correctly
- [ ] Test on mobile devices
- [ ] Check all forms for validation

### Performance
- [ ] Enable Supabase connection pooling (if needed)
- [ ] Optimize images (use WebP format)
- [ ] Set up CDN for static assets
- [ ] Enable caching headers
- [ ] Monitor bundle size

### Monitoring
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure analytics (e.g., Google Analytics)
- [ ] Set up uptime monitoring
- [ ] Configure Supabase alerts
- [ ] Set up backup schedules

## Post-Deployment Configuration 🔧

### 1. Update Supabase Auth Settings

In Supabase Dashboard > Authentication > URL Configuration:
- Site URL: `https://tradetoys.ca`
- Redirect URLs: `https://tradetoys.ca/**`

### 2. Email Templates

Customize email templates in Supabase:
- Authentication > Email Templates
- Update branding to match Christmas theme

### 3. Set Up Email Provider (Optional)

For production, configure custom SMTP:
- Supabase > Project Settings > Auth
- Configure SMTP settings with your email provider

### 4. Storage Configuration

Ensure storage limits are appropriate:
- Free tier: 1GB
- Monitor usage in Supabase Dashboard
- Set up alerts for storage limits

## Domain Configuration 🌐

### For tradetoys.ca:

1. **Buy Domain** (if not already owned)
   - Namecheap, GoDaddy, Google Domains, etc.

2. **DNS Configuration**
   
   For Vercel:
   ```
   Type: A
   Name: @
   Value: 76.76.19.19 (Vercel IP)
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

   For custom server:
   ```
   Type: A
   Name: @
   Value: YOUR_SERVER_IP
   
   Type: CNAME
   Name: www
   Value: tradetoys.ca
   ```

3. **SSL Certificate**
   - Vercel: Automatic
   - Netlify: Automatic
   - Self-hosted: Use Let's Encrypt (see above)

## Supabase Production Checklist 🗄️

### Database
- [ ] Enable Point-in-Time Recovery (PITR)
- [ ] Set up automated backups
- [ ] Review and optimize indexes
- [ ] Monitor query performance
- [ ] Set up connection pooling if needed

### Storage
- [ ] Verify bucket is public
- [ ] Test image upload/display
- [ ] Set up CDN for images (optional)
- [ ] Configure image optimization

### Authentication
- [ ] Test login/logout flow
- [ ] Configure password requirements
- [ ] Set up rate limiting
- [ ] Enable email verification
- [ ] Test password reset flow

## Scaling Considerations 📈

### When You Outgrow Free Tier:

**Supabase Pro** ($25/month):
- 8GB database
- 100GB storage
- 50GB bandwidth
- Daily backups

**Features to Enable:**
- Connection pooling
- Read replicas
- Advanced monitoring
- Custom domains for storage

### Application Scaling:

1. **Optimize Images**
   - Use Next.js Image component
   - Implement lazy loading
   - Use WebP format

2. **Caching**
   - Enable ISR (Incremental Static Regeneration)
   - Use CDN for static assets
   - Implement browser caching

3. **Database**
   - Add indexes on frequently queried columns
   - Use Supabase realtime selectively
   - Implement pagination for large datasets

## Monitoring & Maintenance 📊

### Daily Checks:
- Monitor error rates
- Check storage usage
- Review new user registrations

### Weekly Tasks:
- Review claimed toys
- Check point allocations
- Monitor database performance
- Review security logs

### Monthly Tasks:
- Backup verification
- Security audit
- Performance optimization
- User feedback review

## Troubleshooting Common Issues 🔧

### Issue: Images not loading
- Check storage bucket is public
- Verify CORS settings
- Check Next.js image domains configuration

### Issue: Slow query performance
- Add database indexes
- Enable connection pooling
- Review RLS policies for efficiency

### Issue: Authentication failures
- Check site URL configuration
- Verify redirect URLs
- Review email template settings

### Issue: Running out of storage
- Compress images before upload
- Clean up unused images
- Upgrade Supabase plan

## Support & Resources 📚

- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

## Backup Strategy 💾

### Database Backups:
- Supabase automatic daily backups (Pro plan)
- Manual exports weekly: Database > Backup
- Export SQL schema regularly

### Image Backups:
- Download storage bucket monthly
- Use Supabase CLI to sync: `supabase storage download`

### Code Backups:
- Git repository (GitHub, GitLab)
- Tag releases: `git tag -a v1.0.0 -m "Release version 1.0.0"`

## Emergency Contacts 🚨

Have these ready before launch:
- Supabase support email
- Hosting provider support
- Domain registrar support
- Your technical lead contact
- Backup admin credentials (secure location)

## Go Live Checklist 🎉

- [ ] All tests passing
- [ ] Database deployed and tested
- [ ] Storage configured and tested
- [ ] Admin account created
- [ ] Test accounts created and verified
- [ ] SSL certificate active
- [ ] Domain configured correctly
- [ ] Monitoring tools active
- [ ] Backup system verified
- [ ] Documentation reviewed
- [ ] Emergency contacts prepared
- [ ] Launch announcement ready

## 🎅 You're Ready to Launch!

Once everything is checked off, you can officially launch TradeToys.ca and start spreading Christmas joy!

Remember: Start small, monitor closely, and scale as needed. The platform is built to grow with your community's needs.

**Merry Christmas and Happy Deploying!** 🎄🎁

