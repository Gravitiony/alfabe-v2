Alfabe Mail — Çocuklar için Güvenli E-posta Sistemi
> **v2.0 (Next.js & Docker Edition)**  
> Çocuklar için güvenli, reklamsız ve kontrollü bir ortamda e-posta kullanmasını sağlayan eğitim odaklı mail platformu.
---
🚀 Özellikler
Paneller & Rotalar (Next.js App Router)
Panel / Alan	Rota (Route)	Kullanıcı	Açıklama
Admin Paneli	`/admin`	admin	Tüm sistem ve Mailcow entegrasyon yönetimi
Öğretmen Paneli	`/ogretmen`	ogretmen	Sınıf oluşturma, öğrenci yönetimi ve ödev atama
Öğrenci Portalı	`www.alfabe.co`	...@alfabe.co	Karekod veya normal giriş, mail akışı, ödev takvimi
Kayıt Ol	`/kayit`	Misafir	Kullanıcı adı + şifre. Öğretmen Kaydı: Ad-Soyad, Kurumsal/Kişisel E-posta, Şifre ve OAuth seçenekleri + Aktivasyon maili
---
🛠 Teknik Mimari (Next.js Uyumlu)
Fullstack Framework: Next.js (App Router + Server Actions / API Routes)
Veritabanı & ORM: MySQL 8.4 + Prisma ORM (Prisma Studio ile görsel yönetim)
Mail Sunucusu: Mailcow (IMAP/SMTP entegrasyonu — Node.js `nodemailer` ve `imapflow` ile)
Cache / Queue: Redis Alpine + BullMQ (Arka plan mail kuyrukları ve asenkron görevler)
Kimlik Doğrulama (Auth): Auth.js (NextAuth) veya Lucia Auth (Rol tabanlı: `admin`, `ogretmen`, `ogrenci`)
Arayüz (Frontend): Tailwind CSS + Shadcn UI + Recharts (İstatistikler)
---
🐳 Docker & Dağıtım Mimarisi
Merkezi `alfabe-proxy` (nginx) yapısı ile tam uyumlu, dış dünyaya `alfabe.co` üzerinden hizmet veren servis matrisi:
Servis	Container Adı	Dahil Olduğu Ağlar	Açıklama
Proxy (Nginx)	`alfabe-proxy`	`alfabe_net`	Dış dünya ile köprü
Alfabe Mail (App)	`alfabemail`	`alfabe_net`, `mailcowdockerized_mailcow-network`	Next.js Uygulaması (Port 3000)
Worker	`alfabemail-worker`	`alfabe_net`, `mailcowdockerized_mailcow-network`	BullMQ Asenkron İş Kuyruğu
Veritabanı	`alfabemail_mysql`	`alfabe_net`	MySQL 8.4 + Prisma Studio
Redis	`alfabemail_redis`	`alfabe_net`	Cache & BullMQ Queue
`docker-compose.yml` Örneği
```yaml
version: '3.8'

services:
  alfabemail:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: alfabemail
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=mysql://root:guvenli_sifre@mysql:3306/alfabemail
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    networks:
      - alfabe_net
      - mailcowdockerized_mailcow-network
    depends_on:
      - mysql
      - redis

  alfabemail-worker:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: alfabemail-worker
    restart: unless-stopped
    command: ["npm", "run", "worker"]
    environment:
      - DATABASE_URL=mysql://root:guvenli_sifre@mysql:3306/alfabemail
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    networks:
      - alfabe_net
      - mailcowdockerized_mailcow-network
    depends_on:
      - redis

  mysql:
    image: mysql:8.4
    container_name: alfabemail_mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: guvenli_sifre
      MYSQL_DATABASE: alfabemail
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - alfabe_net

  redis:
    image: redis:alpine
    container_name: alfabemail_redis
    restart: unless-stopped
    networks:
      - alfabe_net

volumes:
  mysql_data:

networks:
  alfabe_net:
    external: true
  mailcowdockerized_mailcow-network:
    external: true
