import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import UserManagerModal from '../../components/userManagerModal/UserManagerModal';
import ConfirmationDelete from '../../components/confirmationModal/ConfirmationDelete';
import styles from './UserManager.module.css';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 10;

export default function UserManager() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // States cho Filters & Pagination
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // States cho Modal Thêm/Sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // States cho Modal Xóa (Confirmation)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // KIỂM TRA QUYỀN TRUY CẬP (Chỉ Admin mới được quản lý User)
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('web-quiz-bcn-auth-user'));
    if (!storedUser || storedUser.role !== 'admin') {
      toast.error('Truy cập bị từ chối: Chỉ Admin mới có quyền truy cập trang này!');
      navigate('/quiz-list', { replace: true });
    }
  }, [navigate]);

  // Lấy dữ liệu từ Supabase
  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' });

      // Lọc theo tìm kiếm (Tìm theo MSSV, Tên hoặc Email)
      if (searchTerm) {
        query = query.or(`mssv.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      // Phân trang
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      query = query
        .range(from, to)
        .order('created_at', { ascending: false });

      const { data, count, error } = await query;

      if (error) throw error;

      setUsers(data || []);
      if (count !== null) setTotalCount(count);

    } catch (error) {
      console.error('Lỗi khi tải danh sách Người dùng:', error.message);
      toast.error('Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm]);

  const handleFilterChange = () => setPage(1);

  // --- Handlers cho Modal Thêm/Sửa ---
  const handleAddClick = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleModalSave = async (savedUserData) => {
    // Tạm thời log ra, ở đây bạn sẽ gọi API Supabase Auth Admin để tạo/sửa user
    console.log("Dữ liệu cần lưu:", savedUserData);
    setIsModalOpen(false);
    toast.success('Đã ghi nhận lưu thông tin người dùng!');
    fetchUsers();
  };

  // --- Handlers cho Modal Xóa Mềm ---
  const handleDeleteClick = (mssv) => {
    setItemToDelete(mssv);
    setIsDeleteModalOpen(true);
  };

  const executeDeleteAction = async () => {
    if (!itemToDelete) return;
    try {
      // Xóa mềm: Chuyển is_active thành false
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('mssv', itemToDelete);

      if (error) throw error;
      
      toast.success('Đã khóa tài khoản thành công (Xóa mềm)!');
      setIsDeleteModalOpen(false); 
      setItemToDelete(null);
      fetchUsers(); // Tải lại bảng
    } catch (err) {
      console.error('Lỗi xóa mềm user:', err);
      toast.error('Lỗi khi khóa người dùng.');
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // --- Tiện ích Render Role ---
  const renderRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className={`${styles.badge} ${styles.badgeAdmin}`}>Admin</span>;
      case 'editor':
        return <span className={`${styles.badge} ${styles.badgeEditor}`}>Editor</span>;
      default:
        return <span className={`${styles.badge} ${styles.badgeStudent}`}>Student</span>;
    }
  };

  return (
    <div className={styles.container}>
      
      {/* 1. FILTER BAR & ADD BUTTON */}
      <div className={styles.topActions}>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo MSSV, Họ tên hoặc Email..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); handleFilterChange(); }}
          />
        </div>

        <button className={styles.btnAdd} onClick={handleAddClick}>
          <Plus size={18} /> Tạo tài khoản mới
        </button>
      </div>

      {/* 2. BẢNG QUẢN LÝ (TABLE) */}
      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loadingState}>Đang tải dữ liệu...</div>
        ) : users.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th width="15%">MSSV</th>
                <th width="22%">HỌ VÀ TÊN</th>
                <th width="25%">EMAIL</th>
                <th width="12%">VAI TRÒ</th>
                <th width="14%">TRẠNG THÁI</th>
                <th width="12%" className={styles.textRight}>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.mssv}>
                  <td className={styles.mssvCell}>{user.mssv}</td>
                  <td className={styles.nameCell}>{user.full_name}</td>
                  <td className={styles.emailCell}>{user.email}</td>
                  <td>{renderRoleBadge(user.role)}</td>
                  <td>
                    {/* Hiển thị trạng thái Hoạt động / Đã khóa */}
                    <span className={user.is_active ? styles.statusActive : styles.statusInactive}>
                      <span className={styles.dot}></span>
                      {user.is_active ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button className={styles.btnAction} onClick={() => handleEditClick(user)} title="Sửa thông tin">
                        <Edit2 size={16} />
                      </button>
                      <button className={styles.btnActionDelete} onClick={() => handleDeleteClick(user.mssv)} title="Khóa tài khoản">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.emptyState}>Không tìm thấy người dùng nào.</div>
        )}
      </div>

      {/* 3. PHÂN TRANG */}
      <div className={styles.bottomSection}>
        <div className={styles.pageInfo}>
          Hiển thị {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, totalCount)} trong số {totalCount} người dùng
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button 
              className={styles.pageBtn} 
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft size={18} />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                className={`${styles.pageNumber} ${page === pageNum ? styles.pageActive : ''}`}
                onClick={() => setPage(pageNum)}
              >
                {pageNum}
              </button>
            ))}

            <button 
              className={styles.pageBtn} 
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* MODAL THÊM / SỬA */}
      <UserManagerModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={selectedUser}
        onSave={handleModalSave}
      />
      
      {/* MODAL XÁC NHẬN KHÓA TÀI KHOẢN */}
      <ConfirmationDelete 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={executeDeleteAction}
        title="Khóa tài khoản này?" 
        message="Bạn có chắc chắn muốn khóa tài khoản này? Người dùng sẽ không thể đăng nhập vào hệ thống cho đến khi được mở khóa lại."
      />
    </div>
  );
}