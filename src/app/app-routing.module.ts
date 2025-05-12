import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { InscriptionComponent } from './inscription/inscription.component';
import { LoginComponent } from './login/login.component';
import { UserListComponent } from './user-list/user-list.component';
import { UserEditComponent } from './user-edit/user-edit.component';
import { UserFormComponent } from './user-form/user-form.component';
import { VerifyAccountComponent } from './verify-account/verify-account.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminGuard } from './guards/admin.guard';
import { FaceAuthComponent } from './face-auth/face-auth.component';
import { MyAccountComponent } from './my-account/my-account.component';
import { PhotoUploadTestComponent } from './photo-upload-test/photo-upload-test.component'; // ✅ à ajouter
import { HistoriqueComponent } from './historique/historique.component';
import { LivraisonComponent } from './livraison/livraison.component';
import { ProfileComponent } from './profile/profile.component';
import { MapsComponent } from './maps/maps.component';
import { ProductListComponent } from './product-list/product-list.component';
import { ProduitCreateComponent } from './produit-create/produit-create.component';
import { HomeclientComponent } from './homeclient/homeclient.component';
import { NotificationComponent } from './notification/notification.component';
import { ProductListClientComponent } from './product-list-client/product-list-client.component';
import { ProductPromotionViewComponent } from './product-promotion-view/product-promotion-view.component';
import { ProduitDetailsClientComponent } from './produit-details-client/produit-details-client.component';
import { ProduitDetailsComponent } from './produit-details/produit-details.component';
import { ProduitParCategorieClientComponent } from './produit-par-categorie-client/produit-par-categorie-client.component';
import { ProduitParCategorieComponent } from './produit-par-categorie/produit-par-categorie.component';
import { RecommendedProductsComponent } from './recommended-products/recommended-products.component';
import { StockPurchaseDashboardComponent } from './stock-purchase-dashboard/stock-purchase-dashboard.component';
import { CommandeComponent } from './commande/commande.component';
import { WishlistComponent } from './wishlist/wishlist.component';
import { PaymentComponent } from './payment/payment.component';
import { FactureComponent } from './facture/facture.component';


const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'inscription', component: InscriptionComponent },
  { path: 'login', component: LoginComponent },
  { path: 'verify', component: VerifyAccountComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'stats', component: DashboardComponent, canActivate: [AdminGuard] },
  { path: 'users', component: UserListComponent, canActivate: [AdminGuard] },
  { path: 'users/add', component: UserFormComponent, canActivate: [AdminGuard] },
  { path: 'users/edit/:id', component: UserEditComponent, canActivate: [AdminGuard] },
  { path: 'face-auth', component: FaceAuthComponent },
  { path: 'my-account', component: MyAccountComponent },
  { path: 'test-upload', component: PhotoUploadTestComponent }, // ✅ nouvelle route
    { path: 'livraison/:userId', component: LivraisonComponent },
  { path: 'profile/:userId', component: ProfileComponent },
  { path: 'historique/:userId', component: HistoriqueComponent },
    { path: 'map/:userId', component: MapsComponent },
    { path: 'produit-create', component: ProduitCreateComponent },
    { path: 'products', component: ProductListComponent },
    { path: 'homeclient', component: HomeclientComponent },
    { path: 'produit-create', component: ProduitCreateComponent },
    { path: 'produit-create/:id', component: ProduitCreateComponent },
    { path: 'produit-details/:id', component: ProduitDetailsComponent },
    { path: 'products', component: ProductListComponent },
    { path: 'categorie/:category', component: ProduitParCategorieComponent },
    { path: 'products', component: ProduitParCategorieComponent },
    { path: 'notification', component: NotificationComponent },
    { path: 'productListClient', component: ProductListClientComponent },
    { path: 'produitparCategorieClient', component: ProduitParCategorieClientComponent },
    { path: 'produit-detailsClient/:id', component: ProduitDetailsClientComponent},
    { path: 'stock-dashboard', component: StockPurchaseDashboardComponent },
    { path: 'promotionsClient', component: ProductPromotionViewComponent },
    { path: 'RecommendedProducts', component:  RecommendedProductsComponent },
    { path: 'commande', component: CommandeComponent },
    { path: 'payment/:commandeId', component: PaymentComponent }, // Corrected param name to match usage
    { path: 'facture/:transactionId', component: FactureComponent },
    { path: 'wishlist', component: WishlistComponent },
  
  
    { 
      path: 'promotions', 
      loadChildren: () => import('./promotion-routing.module').then(m => m.PromotionsRoutingModule)},
      { path: '', loadChildren: () => import('./fidelity/fidelity.module').then(m => m.FidelityModule) },
    {
      path: 'produits-par-categorie',
      component: ProduitParCategorieComponent
    },

  // redirection par défaut
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
