import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../models/rental_request_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/car_provider.dart';
import '../../services/rental_service.dart';
import '../../widgets/car_card.dart';
import '../../widgets/server_config_dialog.dart';
import '../profile/profile_screen.dart';
import '../rentals/rental_order_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentTabIndex = 0;
  final TextEditingController _searchController = TextEditingController();

  final RentalService _rentalService = RentalService();
  List<RentalRequestModel> _myRentals = [];
  bool _isLoadingRentals = false;
  String? _rentalsError;
  String _selectedStatusFilter = 'ALL';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<CarProvider>(context, listen: false).loadCars();
      _loadMyRentals();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadMyRentals() async {
    setState(() {
      _isLoadingRentals = true;
      _rentalsError = null;
    });

    try {
      final list = await _rentalService.getMyRentals();
      if (mounted) {
        setState(() {
          _myRentals = list;
          _isLoadingRentals = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _rentalsError = e.toString().replaceAll('Exception: ', '');
          _isLoadingRentals = false;
        });
      }
    }
  }

  List<RentalRequestModel> get _filteredRentals {
    if (_selectedStatusFilter == 'ALL') return _myRentals;

    if (_selectedStatusFilter == 'PENDING') {
      return _myRentals.where((r) => r.status == 'PENDING' || r.status == 'SIGNED').toList();
    }

    return _myRentals.where((r) => r.status.toUpperCase() == _selectedStatusFilter).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentTabIndex,
        children: [
          _buildCatalogTab(),
          _buildMyRentalsTab(),
          const ProfileScreen(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentTabIndex,
        onTap: (index) {
          setState(() {
            _currentTabIndex = index;
          });
          if (index == 1) {
            _loadMyRentals();
          }
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.directions_car_rounded),
            label: 'Khám phá',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.assignment_outlined),
            activeIcon: Icon(Icons.assignment_rounded),
            label: 'Đơn thuê',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline_rounded),
            activeIcon: Icon(Icons.person_rounded),
            label: 'Tài khoản',
          ),
        ],
      ),
    );
  }

  Widget _buildCatalogTab() {
    final authProvider = Provider.of<AuthProvider>(context);
    final carProvider = Provider.of<CarProvider>(context);
    final user = authProvider.user;

    return SafeArea(
      child: RefreshIndicator(
        onRefresh: () => carProvider.loadCars(),
        color: const Color(0xFF2563EB),
        child: CustomScrollView(
          slivers: [
            // Top App Header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Xin chào, ${user?.fullName ?? "Khách hàng"} 👋',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            letterSpacing: -0.3,
                          ),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Chọn xe tự lái cho chuyến đi của bạn',
                          style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                        ),
                      ],
                    ),
                    IconButton(
                      tooltip: 'Đổi máy chủ API',
                      icon: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E293B),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                        ),
                        child: const Icon(Icons.dns_rounded, size: 20, color: Color(0xFF2563EB)),
                      ),
                      onPressed: () {
                        showDialog(
                          context: context,
                          builder: (_) => const ServerConfigDialog(),
                        ).then((_) {
                          carProvider.loadCars();
                          _loadMyRentals();
                        });
                      },
                    ),
                  ],
                ),
              ),
            ),

            // Promotional Banner Card
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFF1E40AF), Color(0xFF1E293B)],
                    ),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF3B82F6).withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFF10B981),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text(
                                'VELORA LUXURY',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.8,
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'Bảo hiểm 2 chiều & Đối soát minh bạch',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Hợp đồng ký điện tử trực tiếp & Quét VietQR 24/7',
                              style: TextStyle(fontSize: 11, color: Color(0xFFCBD5E1)),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Icon(
                        Icons.shield_outlined,
                        size: 44,
                        color: Color(0xFF60A5FA),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Search Bar
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 10),
                child: TextField(
                  controller: _searchController,
                  onChanged: (val) => carProvider.setSearchQuery(val),
                  decoration: InputDecoration(
                    hintText: 'Tìm kiếm theo hãng xe, dòng xe, biển số...',
                    prefixIcon: const Icon(Icons.search_rounded, size: 22),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear_rounded, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              carProvider.setSearchQuery('');
                            },
                          )
                        : null,
                  ),
                ),
              ),
            ),

            // Category Filter Chips
            SliverToBoxAdapter(
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
                child: Row(
                  children: [
                    FilterChip(
                      selected: carProvider.onlyReady,
                      label: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.check_circle_rounded, size: 14, color: Color(0xFF10B981)),
                          SizedBox(width: 4),
                          Text('Xe sẵn sàng'),
                        ],
                      ),
                      onSelected: (_) => carProvider.toggleOnlyReady(),
                    ),
                    const SizedBox(width: 8),
                    FilterChip(
                      selected: carProvider.seatsFilter == 4,
                      label: const Text('4 Chỗ'),
                      onSelected: (_) => carProvider.setSeatsFilter(4),
                    ),
                    const SizedBox(width: 8),
                    FilterChip(
                      selected: carProvider.seatsFilter == 5,
                      label: const Text('5 Chỗ'),
                      onSelected: (_) => carProvider.setSeatsFilter(5),
                    ),
                    const SizedBox(width: 8),
                    FilterChip(
                      selected: carProvider.seatsFilter == 7,
                      label: const Text('7 Chỗ'),
                      onSelected: (_) => carProvider.setSeatsFilter(7),
                    ),
                    const SizedBox(width: 8),
                    FilterChip(
                      selected: carProvider.transmissionFilter == 'AUTO',
                      label: const Text('Số tự động (Auto)'),
                      onSelected: (_) => carProvider.setTransmissionFilter('AUTO'),
                    ),
                    const SizedBox(width: 8),
                    FilterChip(
                      selected: carProvider.transmissionFilter == 'MANUAL',
                      label: const Text('Số sàn (Manual)'),
                      onSelected: (_) => carProvider.setTransmissionFilter('MANUAL'),
                    ),
                  ],
                ),
              ),
            ),

            // Result Count Bar
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Danh sách xe (${carProvider.cars.length})',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (carProvider.searchQuery.isNotEmpty ||
                        carProvider.seatsFilter != null ||
                        carProvider.transmissionFilter != null ||
                        carProvider.onlyReady)
                      GestureDetector(
                        onTap: () {
                          _searchController.clear();
                          carProvider.resetFilters();
                        },
                        child: const Text(
                          'Đặt lại bộ lọc',
                          style: TextStyle(
                            fontSize: 12,
                            color: Color(0xFF2563EB),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),

            // Car Catalog List Content
            if (carProvider.isLoading)
              const SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(strokeWidth: 2.5),
                      SizedBox(height: 12),
                      Text('Đang nạp danh sách xe...', style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                ),
              )
            else if (carProvider.errorMessage != null)
              SliverFillRemaining(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.cloud_off_rounded, size: 54, color: Color(0xFFEF4444)),
                        const SizedBox(height: 12),
                        Text(
                          carProvider.errorMessage!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 13, color: Color(0xFFCBD5E1)),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: () => carProvider.loadCars(),
                          icon: const Icon(Icons.refresh_rounded),
                          label: const Text('Thử lại'),
                        ),
                        const SizedBox(height: 8),
                        TextButton(
                          onPressed: () {
                            showDialog(
                              context: context,
                              builder: (_) => const ServerConfigDialog(),
                            );
                          },
                          child: const Text('Kiểm tra IP máy chủ'),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else if (carProvider.cars.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.search_off_rounded, size: 54, color: Colors.white.withValues(alpha: 0.3)),
                      const SizedBox(height: 12),
                      const Text(
                        'Không tìm thấy xe phù hợp',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Thử tìm với từ khóa hoặc bộ lọc khác',
                        style: TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final car = carProvider.cars[index];
                      return CarCard(car: car);
                    },
                    childCount: carProvider.cars.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildMyRentalsTab() {
    final dateFormat = DateFormat('dd/MM/yyyy');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Đơn thuê của tôi'),
        actions: [
          IconButton(
            tooltip: 'Làm mới',
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadMyRentals,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadMyRentals,
        color: const Color(0xFF2563EB),
        child: Column(
          children: [
            // Status Filter Chips Row
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Row(
                children: [
                  _buildStatusChip('Tất cả', 'ALL'),
                  const SizedBox(width: 8),
                  _buildStatusChip('Đã cọc', 'CONFIRMED'),
                  const SizedBox(width: 8),
                  _buildStatusChip('Đang thuê', 'ACTIVE'),
                  const SizedBox(width: 8),
                  _buildStatusChip('Đối soát Escrow', 'HOLDING'),
                  const SizedBox(width: 8),
                  _buildStatusChip('Chờ xử lý', 'PENDING'),
                  const SizedBox(width: 8),
                  _buildStatusChip('Hoàn tất', 'COMPLETED'),
                ],
              ),
            ),

            // Content List
            Expanded(
              child: _buildRentalsContent(dateFormat),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChip(String label, String code) {
    final isSelected = _selectedStatusFilter == code;
    return FilterChip(
      selected: isSelected,
      label: Text(label),
      onSelected: (_) {
        setState(() {
          _selectedStatusFilter = code;
        });
      },
    );
  }

  Widget _buildRentalsContent(DateFormat dateFormat) {
    if (_isLoadingRentals) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(strokeWidth: 2.5),
            SizedBox(height: 12),
            Text('Đang nạp danh sách đơn thuê...', style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }

    if (_rentalsError != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.cloud_off_rounded, size: 50, color: Color(0xFFEF4444)),
              const SizedBox(height: 12),
              Text(_rentalsError!, textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, color: Color(0xFFCBD5E1))),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _loadMyRentals,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Thử lại'),
              ),
            ],
          ),
        ),
      );
    }

    final list = _filteredRentals;
    if (list.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.assignment_outlined, size: 60, color: Colors.white.withValues(alpha: 0.25)),
              const SizedBox(height: 16),
              const Text(
                'Không có đơn thuê nào',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 6),
              const Text(
                'Bạn chưa có đơn thuê nào trong danh mục này.',
                style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: () {
                  setState(() => _currentTabIndex = 0);
                },
                icon: const Icon(Icons.directions_car_rounded),
                label: const Text('Thuê xe ngay'),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final item = list[index];
        return _buildRentalItemCard(item, dateFormat);
      },
    );
  }

  Widget _buildRentalItemCard(RentalRequestModel item, DateFormat dateFormat) {
    Color badgeColor;
    String badgeText;

    switch (item.status.toUpperCase()) {
      case 'PENDING':
        badgeColor = const Color(0xFFF59E0B);
        badgeText = 'Chờ ký HĐ';
        break;
      case 'SIGNED':
        badgeColor = const Color(0xFF3B82F6);
        badgeText = 'Chờ đặt cọc';
        break;
      case 'CONFIRMED':
        badgeColor = const Color(0xFF10B981);
        badgeText = 'Đã đặt cọc';
        break;
      case 'ACTIVE':
        badgeColor = const Color(0xFF8B5CF6);
        badgeText = 'Đang sử dụng';
        break;
      case 'HOLDING':
        badgeColor = const Color(0xFFF97316);
        badgeText = 'Đối soát Escrow';
        break;
      case 'COMPLETED':
        badgeColor = const Color(0xFF059669);
        badgeText = 'Hoàn tất';
        break;
      case 'DISPUTED':
        badgeColor = const Color(0xFFEF4444);
        badgeText = 'Đang khiếu nại';
        break;
      default:
        badgeColor = Colors.grey;
        badgeText = item.status;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => RentalOrderDetailScreen(request: item),
            ),
          ).then((_) => _loadMyRentals());
        },
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Row: Code + Status Badge
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.tag_rounded, size: 16, color: Color(0xFF2563EB)),
                      Text(
                        item.id.substring(0, 8).toUpperCase(),
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 0.5),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: badgeColor.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: badgeColor),
                    ),
                    child: Text(
                      badgeText,
                      style: TextStyle(color: badgeColor, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const Divider(height: 16),

              // Vehicle & Dates
              Row(
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: item.carImageUrl != null && item.carImageUrl!.isNotEmpty
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(item.carImageUrl!, fit: BoxFit.cover),
                          )
                        : const Icon(Icons.directions_car_filled_rounded, color: Color(0xFF2563EB), size: 28),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.carDisplayName.isNotEmpty ? item.carDisplayName : 'Xe tự lái VELORA',
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Biển số: ${item.carLicensePlate ?? "---"}',
                          style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${dateFormat.format(item.startTime)} - ${dateFormat.format(item.endTime)} (${item.totalDays} ngày)',
                          style: const TextStyle(fontSize: 11, color: Color(0xFFCBD5E1)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const Divider(height: 16),

              // Bottom Row: Financial summary + Arrow
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Tiền cọc bảo đảm', style: TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
                      Text(
                        item.formattedDeposit,
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFFF59E0B)),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      const Text('Chi tiết', style: TextStyle(fontSize: 12, color: Color(0xFF60A5FA), fontWeight: FontWeight.bold)),
                      const SizedBox(width: 2),
                      const Icon(Icons.chevron_right_rounded, size: 18, color: Color(0xFF60A5FA)),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
