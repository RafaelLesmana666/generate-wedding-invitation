# generate-wedding-invitation

## Konfigurasi

Deploy folder ini sebagai project generator dan atur environment `INVITATION_TOKEN` serta `POSTGRES_URL` (atau `DATABASE_URL`). `INVITATION_TOKEN` harus sama dengan token yang dimasukkan saat generate. Generator memvalidasi token di `POST /api/invitations` dan menulis undangan ke database.

Deploy project [Undangan](../Undangan) dengan koneksi database yang sama. API di project Undangan hanya memvalidasi ID undangan dan mengunci kolom `device_id`.

Setiap tamu tersimpan dengan ID `MD5(UUID + INVITATION_TOKEN)`, nama, dan `device_id` yang awalnya kosong. Link memakai parameter `?id=...`. Saat pertama kali dibuka, API Undangan mengunci undangan ke ID browser yang disimpan di `localStorage`; pembukaan dari browser/perangkat berbeda ditolak. Menghapus data browser atau memakai browser profile lain akan membuat ID perangkat baru.
