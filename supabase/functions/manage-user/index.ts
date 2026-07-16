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
    const { id, mssv, email, password, full_name, role, is_active } = userData

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

      // Đồng bộ dữ liệu trạng thái
      await supabase.from('users').update({ is_active, role }).eq('mssv', mssv);

      return new Response(JSON.stringify({ success: true, message: "Đã tạo tài khoản thành công!" }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    } 
    
    if (action === 'UPDATE') {
      // BƯỚC 1: XÁC MINH ID TRUYỀN LÊN TỪ FRONTEND
      if (!id) throw new Error('Không tìm thấy ID người dùng để cập nhật!')

      // BƯỚC 2: CẬP NHẬT TRONG auth.users VÀ KHÓA ĐĂNG NHẬP NẾU CẦN
      const updatePayload: any = {
        email: email, // Cập nhật cả Email trong auth.users
        user_metadata: { mssv, full_name, role },
        // Lệnh này sẽ cấm đăng nhập 100 năm nếu is_active là false, và gỡ cấm (none) nếu is_active là true
        ban_duration: is_active === false ? '876000h' : 'none' 
      }
      
      if (password && password.trim() !== '') {
        if (password.length < 6) throw new Error("Mật khẩu phải có ít nhất 6 ký tự!");
        updatePayload.password = password
      }

      const { error: authErr } = await supabase.auth.admin.updateUserById(id, updatePayload)
      if (authErr) throw authErr

      // BƯỚC 3: CẬP NHẬT TRỰC TIẾP TRONG BẢNG public.users THEO ID
      // Sử dụng trực tiếp SDK của Service Role cho phép đổi cả MSSV và Email mà không cần RPC phức tạp
      const { error: dbErr } = await supabase
        .from('users')
        .update({
          mssv: mssv,
          full_name: full_name,
          email: email,
          role: role,
          is_active: is_active
        })
        .eq('id', id);
      
      if (dbErr) throw dbErr;

      return new Response(JSON.stringify({ success: true, message: "Đã cập nhật thông tin tài khoản thành công!" }), 
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