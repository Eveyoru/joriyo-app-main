import { StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { BannerCarousel } from '@/components/BannerCarousel';
import { CartSummaryBar } from '@/components/CartSummaryBar';

function ExploreScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }} // Add padding for CartSummaryBar
      >
        {/* Banner Carousel */}
        <BannerCarousel />

        {/* Welcome Message */}
        <ThemedView style={styles.welcomeSection}>
          <ThemedText style={styles.welcomeText}>
            Welcome to Blinkeyit
          </ThemedText>
          <ThemedText style={styles.subtitleText}>
            Your one-stop shopping destination
          </ThemedText>
        </ThemedView>
      </ScrollView>
      
      {/* Cart Summary Bar */}
      <CartSummaryBar />
    </ThemedView>
  );
}

export default ExploreScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    padding: 15,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
