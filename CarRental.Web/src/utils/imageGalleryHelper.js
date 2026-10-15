/**
 * imageGalleryHelper.js
 * Comprehensive utilities for parsing, serializing, and managing multi-angle vehicle photo galleries.
 */

export const DEFAULT_PHOTO_SLOTS = [
  {
    slotIndex: 0,
    slotName: 'Góc 1: Ngoại thất 3/4 trước',
    suggestedTitle: 'Ngoại thất góc 3/4 trước',
    tag: 'Góc chính',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    description: 'Ảnh đại diện chính của xe, thể hiện tổng thể ngoại thất phía trước và hệ thống đèn.',
    required: true,
  },
  {
    slotIndex: 1,
    slotName: 'Góc 2: Khoang lái & Vô lăng',
    suggestedTitle: 'Khoang lái & Taplo kỹ thuật số',
    tag: 'Nội thất',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    description: 'Vô lăng thể thao, cụm đồng hồ công tơ mét, màn hình trung tâm và cần số.',
    required: false,
  },
  {
    slotIndex: 2,
    slotName: 'Góc 3: Hàng ghế hành khách',
    suggestedTitle: 'Hàng ghế sau bọc da cao cấp',
    tag: 'Không gian',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    description: 'Khoảng để chân, bệ tỳ tay và cửa gió điều hòa phía sau.',
    required: false,
  },
  {
    slotIndex: 3,
    slotName: 'Góc 4: Đuôi xe & Cốp để đồ',
    suggestedTitle: 'Đuôi xe & Cốp để hành lý',
    tag: 'Góc sau',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    description: 'Đèn hậu LED sắc sảo và dung tích khoang chứa vali cho hành trình.',
    required: false,
  },
  {
    slotIndex: 4,
    slotName: 'Góc 5: Mâm xe & Chi tiết',
    suggestedTitle: 'Mâm xe thể thao & Chi tiết hoàn thiện',
    tag: 'Chi tiết',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    description: 'La-zăng đúc nguyên bản, đĩa phanh thể thao và nước sơn ngoại thất.',
    required: false,
  },
];

export const CURATED_PRESETS = [
  {
    name: 'Porsche (Taycan / Panamera / 911 / Macan)',
    brand: 'porsche',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80',
        title: 'Ngoại thất góc 3/4 trước',
        tag: 'Góc chính',
        description: 'Đường nét khí động học thể thao đặc trưng của Porsche.'
      },
      {
        url: 'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=1200&q=80',
        title: 'Khoang lái Porsche Advanced Cockpit',
        tag: 'Nội thất',
        description: 'Vô lăng thể thao GT, cụm đồng hồ kỹ thuật số uốn cong.'
      },
      {
        url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80',
        title: 'Hàng ghế da cao cấp công thái học',
        tag: 'Không gian',
        description: 'Ghế thể thao bọc da Nappa chỉnh điện 14 hướng.'
      },
      {
        url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
        title: 'Đuôi xe & Cốp để hành lý',
        tag: 'Góc sau',
        description: 'Dải đèn LED hậu nối liền đặc trưng cùng cốp sau rộng rãi.'
      },
      {
        url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
        title: 'Mâm xe Mission E Design & Phanh hiệu năng cao',
        tag: 'Chi tiết',
        description: 'Bộ mâm 21 inch khí động học, cùm phanh thể thao sơn bóng.'
      }
    ]
  },
  {
    name: 'Mercedes-Benz (C-Class / E-Class / S-Class / GLC)',
    brand: 'mercedes',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80',
        title: 'Ngoại thất góc 3/4 trước',
        tag: 'Góc chính',
        description: 'Lưới tản nhiệt ngôi sao ba cánh và đèn Digital Light sang trọng.'
      },
      {
        url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80',
        title: 'Khoang lái MBUX & Đèn viền 64 màu',
        tag: 'Nội thất',
        description: 'Màn hình cảm ứng OLED trung tâm cỡ lớn, ốp gỗ óc chó tự nhiên.'
      },
      {
        url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80',
        title: 'Hàng ghế thương gia phía sau',
        tag: 'Không gian',
        description: 'Ghế bọc da Artico êm ái với gối tựa đầu cao cấp.'
      },
      {
        url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
        title: 'Đuôi xe thanh lịch & Cốp mở điện',
        tag: 'Góc sau',
        description: 'Cụm đèn hậu LED đồ họa tam giác sắc sảo, mở cốp rảnh tay.'
      },
      {
        url: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=1200&q=80',
        title: 'Mâm xe hợp kim đa chấu AMG',
        tag: 'Chi tiết',
        description: 'Mâm đa chấu thể thao phay bóng 2 tông màu cao cấp.'
      }
    ]
  },
  {
    name: 'BMW (3 / 5 / 7 Series & X-Series / M Sport)',
    brand: 'bmw',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80',
        title: 'Ngoại thất góc 3/4 trước',
        tag: 'Góc chính',
        description: 'Lưới tản nhiệt quả thận kép Iconic Glow sắc nét.'
      },
      {
        url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
        title: 'Khoang lái BMW Curved Display',
        tag: 'Nội thất',
        description: 'Màn hình kép cong chạy hệ điều hành iDrive mượt mà.'
      },
      {
        url: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80',
        title: 'Hàng ghế da Sensafin cao cấp',
        tag: 'Không gian',
        description: 'Không gian cabin thoáng đãng với cửa sổ trời toàn cảnh.'
      },
      {
        url: 'https://images.unsplash.com/photo-1520050206274-a1ae44613e6d?auto=format&fit=crop&w=1200&q=80',
        title: 'Đuôi xe thể thao & Đèn hậu chữ L 3D',
        tag: 'Góc sau',
        description: 'Cánh lướt gió tinh tế và ống xả kép thể thao.'
      },
      {
        url: 'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?auto=format&fit=crop&w=1200&q=80',
        title: 'Mâm đúc thể thao M Bicolor & Phanh M Sport',
        tag: 'Chi tiết',
        description: 'Mâm hợp kim nhôm siêu nhẹ, cùm phanh thể thao đặc trưng.'
      }
    ]
  },
  {
    name: 'Audi (A4 / A6 / Q5 / Q7 / e-tron)',
    brand: 'audi',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1200&q=80',
        title: 'Ngoại thất góc 3/4 trước',
        tag: 'Góc chính',
        description: 'Lưới tản nhiệt Singleframe liền khối và đèn HD Matrix LED.'
      },
      {
        url: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80',
        title: 'Khoang lái Audi Virtual Cockpit Plus',
        tag: 'Nội thất',
        description: 'Hệ thống màn hình hiển thị số hóa sắc nét.'
      },
      {
        url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80',
        title: 'Hàng ghế da Valcona ôm sát thể thao',
        tag: 'Không gian',
        description: 'Chất liệu da cao cấp may chỉ kim cương tỉ mỉ.'
      },
      {
        url: 'https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?auto=format&fit=crop&w=1200&q=80',
        title: 'Đuôi xe & Đèn hậu LED chạy tia',
        tag: 'Góc sau',
        description: 'Hiệu ứng ánh sáng chào đón và tạm biệt ấn tượng.'
      },
      {
        url: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1200&q=80',
        title: 'Mâm đúc hợp kim Audi Sport 5 chấu',
        tag: 'Chi tiết',
        description: 'Bộ la-zăng phay bóng tương phản kim loại xám titan.'
      }
    ]
  },
  {
    name: 'VinFast (VF 8 / VF 9 / VF 7 / VF 6)',
    brand: 'vinfast',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80',
        title: 'Ngoại thất góc 3/4 trước',
        tag: 'Góc chính',
        description: 'Dải đèn LED hình cánh chim chữ V nhận diện thương hiệu Việt.'
      },
      {
        url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
        title: 'Khoang lái với màn hình trung tâm 15.6 inch',
        tag: 'Nội thất',
        description: 'Cần số dạng nút bấm hiện đại và trợ lý ảo thông minh tiếng Việt.'
      },
      {
        url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80',
        title: 'Khoang hành khách rộng rãi phong cách gia đình',
        tag: 'Không gian',
        description: 'Ghế ngồi êm ái tích hợp sưởi và thông gió cho cả 2 hàng ghế.'
      },
      {
        url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
        title: 'Đuôi xe & Cốp chứa đồ dung tích lớn',
        tag: 'Góc sau',
        description: 'Cốp sau rộng rãi có thể gập hàng ghế sau tăng diện tích chứa đồ.'
      },
      {
        url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
        title: 'Mâm khí động học 20 inch đa chấu',
        tag: 'Chi tiết',
        description: 'Tối ưu hóa cản gió giúp gia tăng quãng đường di chuyển thuần điện.'
      }
    ]
  },
  {
    name: 'Sedan / SUV / Đa dụng (Toyota, Honda, Hyundai, Ford)',
    brand: 'general',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
        title: 'Ngoại thất góc 3/4 trước',
        tag: 'Góc chính',
        description: 'Thiết kế hiện đại, gầm cao thoáng đãng phù hợp mọi cung đường.'
      },
      {
        url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
        title: 'Khoang lái tiện nghi & Màn hình Apple CarPlay',
        tag: 'Nội thất',
        description: 'Bố trí công thái học thân thiện, kết nối thông minh không dây.'
      },
      {
        url: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80',
        title: 'Hàng ghế hành khách rộng rãi',
        tag: 'Không gian',
        description: 'Ghế ngồi thoải mái với độ ngả lưng tốt cho các chuyến đi dài.'
      },
      {
        url: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80',
        title: 'Đuôi xe & Cốp chứa hành lý đa dụng',
        tag: 'Góc sau',
        description: 'Khoang hành lý linh hoạt, sàn phẳng dễ dàng xếp đồ đạc.'
      },
      {
        url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80',
        title: 'Mâm đúc thể thao & Lốp gai bám đường',
        tag: 'Chi tiết',
        description: 'Bền bỉ, vận hành êm ái và ổn định trên mọi địa hình.'
      }
    ]
  }
];

/**
 * Parses any incoming vehicle ImageUrl string (JSON array, comma/pipe-delimited, or single URL)
 * into a structured array of photo objects.
 */
export const parseVehicleImages = (rawInput) => {
  if (!rawInput || typeof rawInput !== 'string') {
    return [];
  }

  const trimmed = rawInput.trim();

  // Case 1: JSON array string
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item, idx) => {
          const slot = DEFAULT_PHOTO_SLOTS[idx];
          if (typeof item === 'string') {
            return {
              id: `img-${idx}-${Date.now()}`,
              url: item,
              title: slot?.suggestedTitle || `Hình ảnh góc #${idx + 1}`,
              tag: slot?.tag || 'Bổ sung',
              description: slot?.description || '',
            };
          }
          return {
            id: item.id || `img-${idx}-${Date.now()}`,
            url: item.url || '',
            title: item.title || slot?.suggestedTitle || `Hình ảnh góc #${idx + 1}`,
            tag: item.tag || slot?.tag || 'Bổ sung',
            description: item.description || '',
          };
        }).filter(item => Boolean(item.url));
      }
    } catch {
      // Ignore JSON error and proceed to delimited parsing
    }
  }

  // Case 2: Newlines, pipes, or commas
  const lines = trimmed.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
  const results = [];
  let urlCount = 0;

  for (const line of lines) {
    const segments = line.split(',').map(s => s.trim()).filter(Boolean);
    for (const seg of segments) {
      if (seg.includes('|')) {
        const [url, title, tag, desc] = seg.split('|').map(p => p.trim());
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
          const slot = DEFAULT_PHOTO_SLOTS[urlCount];
          results.push({
            id: `img-${urlCount}-${Date.now()}`,
            url,
            title: title || slot?.suggestedTitle || `Góc ảnh #${urlCount + 1}`,
            tag: tag || slot?.tag || 'Bổ sung',
            description: desc || '',
          });
          urlCount++;
        }
      } else if (seg.startsWith('http://') || seg.startsWith('https://')) {
        const slot = DEFAULT_PHOTO_SLOTS[urlCount];
        results.push({
          id: `img-${urlCount}-${Date.now()}`,
          url: seg,
          title: slot?.suggestedTitle || `Góc ảnh #${urlCount + 1}`,
          tag: slot?.tag || (urlCount === 0 ? 'Góc chính' : 'Bổ sung'),
          description: slot?.description || '',
        });
        urlCount++;
      }
    }
  }

  return results;
};

/**
 * Serializes structured image array into a compact, clean JSON string for database storage.
 */
export const serializeVehicleImages = (imagesArray) => {
  if (!imagesArray || !Array.isArray(imagesArray)) return '';
  const valid = imagesArray.filter(i => i && typeof i.url === 'string' && i.url.trim().length > 0);
  if (valid.length === 0) return '';

  const clean = valid.map(item => ({
    url: item.url.trim(),
    title: (item.title || '').trim(),
    tag: (item.tag || '').trim(),
    ...(item.description ? { description: item.description.trim() } : {}),
  }));

  return JSON.stringify(clean);
};
