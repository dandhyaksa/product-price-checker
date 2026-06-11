interface Product {
  sku: string;
  name: string;
  price: number;
  special_price: number;
  store_stock_status?: number;
}

interface ApiResponse<T> {
  data: T;
}

async function curl<T>(path: string): Promise<T> {
  const url = `https://jeanne.eraspace.com/${path}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Host': 'jeanne.eraspace.com',
      'Accept': 'application/json',
      'Device-Platform': 'ios',
      'Source': 'eraspace',
      'Accept-Language': 'id-ID,id;q=0.9',
      'X-Source': 'eraspace',
      'Platform': 'eraspace-ios',
      'User-Agent': 'Eraspace/5230201 CFNetwork/3826.600.41 Darwin/24.6.0',
      'Device': 'iPhone'
    }
  });

  const result: ApiResponse<T> = await response.json();
  return result.data;
}

async function searchProduct(productName: string): Promise<Product[]> {
  const encodedProduct = encodeURIComponent(productName);
  const result = await curl<{ items: Product[] }>(
    `products/api/v4.1/searchs/query?limit=10&page=0&q=${encodedProduct}&sort=paling_sesuai&store_code=eraspace`
  );
  return result.items;
}

async function detailProduct(sku: string): Promise<Product | null> {
  try {
    const result = await curl<Product>(`products/api/v4.1/products/${sku}?store_code=eraspace`);
    return result;
  } catch (error) {
    return null;
  }
}

async function searchAndDisplay(productName: string, readlineFn?: (prompt: string) => Promise<string>): Promise<void> {
  console.log(`\n[+] Mencari produk: "${productName}"\n`);

  const products = await searchProduct(productName);

  if (products.length === 0) {
    console.log("[!] Produk tidak ditemukan\n");
    return;
  }

  console.log(`[+] Ditemukan ${products.length} produk:\n`);
  for (let i = 0; i < products.length; i++) {
    console.log(`[${i + 1}] ${products[i].name}`);
    console.log(`    SKU   : ${products[i].sku}`);
    console.log(`    Harga : Rp ${products[i].special_price.toLocaleString('id-ID')}`);
    if (products[i].price !== products[i].special_price) {
      console.log(`    Normal: Rp ${products[i].price.toLocaleString('id-ID')}`);
      console.log(`    Diskon: Rp ${(products[i].price - products[i].special_price).toLocaleString('id-ID')}`);
    }
    console.log();
  }

  let selectedProduct: Product;
  if (readlineFn) {
    const selectedIndex = await readlineFn("[?] Pilih nomor produk: ");
    const index = parseInt(selectedIndex) - 1;
    if (index < 0 || index >= products.length) {
      console.log("[!] Pilihan tidak valid\n");
      return;
    }
    selectedProduct = products[index];
  } else {
    selectedProduct = products[0];
  }

  const productDetail = await detailProduct(selectedProduct.sku);

  if (!productDetail) {
    console.log("[!] Detail produk tidak tersedia\n");
    return;
  }

  console.log("\n[+] Detail Produk:\n");
  console.log(`    Nama         : ${productDetail.name}`);
  console.log(`    Harga Normal : Rp ${productDetail.price.toLocaleString('id-ID')}`);
  console.log(`    Harga Promo  : Rp ${productDetail.special_price.toLocaleString('id-ID')}`);
  if (productDetail.price !== productDetail.special_price) {
    console.log(`    Potongan     : Rp ${(productDetail.price - productDetail.special_price).toLocaleString('id-ID')}`);
  } else {
    console.log(`    Potongan     : -`);
  }
  console.log();
}

function readline(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', (data: string) => {
      resolve(data.toString().trim());
    });
  });
}

async function main() {
  const namaProduk = await readline("[?] Produk: ");
  console.log();

  await searchAndDisplay(namaProduk, readline);

  process.exit(0);
}

export { searchProduct, detailProduct, searchAndDisplay };

if (import.meta.main) {
  main().catch((error) => {
    console.error("[!] Error:", error);
    process.exit(1);
  });
}
