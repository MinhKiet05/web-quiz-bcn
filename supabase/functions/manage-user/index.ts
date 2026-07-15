import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

// Cấu hình CORS để Frontend có thể gọi API này
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Bắt các request preflight của trình duyệt
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Khởi tạo Supabase Client với quyền Service Role (Quyền tối cao)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { action, userData } = await req.json()
    const { mssv, email, password, full_name, role, is_active } = userData

    if (action === 'CREATE') {
      // BƯỚC 1: TẠO USER MỚI TRONG auth.users
      if (!password) throw new Error("Vui lòng nhập mật khẩu cho tài khoản mới!");
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true, // Xác nhận email luôn
        user_metadata: { mssv, full_name, role }
      })
      
      if (authError) throw authError;

      // Note: Nếu bạn đang cài Trigger tự động trên Supabase (handle_new_user), 
      // bản ghi trong public.users đã tự động được sinh ra. 
      // Đoạn update dưới đây đảm bảo cập nhật đúng trạng thái is_active
      await supabase.from('users').update({ is_active, role }).eq('mssv', mssv);

      return new Response(JSON.stringify({ success: true, message: "Đã tạo tài khoản thành công!" }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    } 
    
    if (action === 'UPDATE') {
      // BƯỚC 1: LẤY ID CỦA USER TỪ public.users
      const { data: pUser, error: pErr } = await supabase.from('users').select('id').eq('mssv', mssv).single()
      if (pErr || !pUser) throw new Error('Không tìm thấy user trong hệ thống!')

      // BƯỚC 2: CẬP NHẬT TRONG auth.users
      const updatePayload: any = {
        user_metadata: { mssv, full_name, role }
      }
      // Nếu Admin có gõ mật khẩu mới thì mới cập nhật mật khẩu
      if (password && password.trim() !== '') {
        updatePayload.password = password
      }

      const { error: authErr } = await supabase.auth.admin.updateUserById(pUser.id, updatePayload)
      if (authErr) throw authErr

      // BƯỚC 3: CẬP NHẬT public.users (Đồng bộ hiển thị)
      const { error: pubErr } = await supabase.from('users').update({
        full_name, role, is_active
      }).eq('mssv', mssv)
      
      if (pubErr) throw pubErr

      return new Response(JSON.stringify({ success: true, message: "Đã cập nhật tài khoản thành công!" }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    throw new Error('Action không hợp lệ');

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})